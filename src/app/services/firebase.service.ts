import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import * as firebase from "firebase/app";
import { AngularFireAuth } from "@angular/fire/auth";
import { switchMap } from "rxjs/operators";
import { Router } from "@angular/router";
import { IPick } from "../picks/models/pick.model";
import {
  AngularFirestoreCollection,
  AngularFirestore,
  AngularFirestoreDocument,
} from "@angular/fire/firestore";
import { Sell } from "src/openapi";
import { IChat } from "../chats/chat.model";

@Injectable({
  providedIn: "root",
})
export class FirebaseService {
  user: Observable<firebase.User>;
  info: firebase.User;
  once = true;
  picks: AngularFirestoreCollection<IPick>;
  orders: AngularFirestoreCollection<Sell>;
  chatCol: AngularFirestoreCollection<IChat>;
  email = "";
  constructor(
    private afu: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router
  ) {
    this.user = afu.authState.pipe(
      switchMap((user) => {
        this.info = user;
        if (user !== null) {
          user.getIdTokenResult().then((result) => {
            this.email = result.claims.email;
            if (this.once) {
              router.navigate(
                [
                  !result.claims.role || result.claims.role === "nguoimoi"
                    ? "/profile"
                    : "/tabs/profile",
                ],
                {
                  queryParams: {
                    role: result.claims.role,
                    reload: "yes",
                  },
                }
              );
              this.once = false;
            }
          });
          return of(user);
        } else {
          router.navigate(["/profile"]);
          return of(undefined);
        }
      })
    );
  }

  async getToken() {
    return await firebase.auth().currentUser.getIdToken();
  }

  async resetPass() {
    await this.afu.auth.sendPasswordResetEmail(this.email).catch((err) => {
      alert(err);
    });
    alert(`Kiểm tra email: ${this.email} để thay đổi mật khẩu mới`);
  }

  async getOneDoc(col: string, id: string) {
    return (await firebase.firestore().collection(col).doc(id).get()).data();
  }

  getPicks() {
    const uid = this.getUser().uid;
    this.picks = this.afs.collection("pick_models", (ref) =>
      ref.where("uid", "==", uid).orderBy("gomdon_ctime", "desc").limit(10)
    );
    return this.picks.valueChanges({ idField: "gomdon_id" });
  }
  async getPickDetail(gomdon_id: string) {
    const data = [];
    const docs = await this.afs.firestore
      .collection("pick_models")
      .doc(gomdon_id)
      .collection("models_need_pick")
      .get();
    docs.forEach((doc) => {
      data.push(
        Object.assign(
          {
            _id: doc.id,
          },
          doc.data()
        )
      );
    });
    return data;
  }
  getChats(): Promise<Observable<(IChat & { gomdon_id: string })[]>> {
    return new Promise((r) => {
      this.chatCol = this.afs.collection("chats", (ref) =>
        ref.orderBy("gomdon_ctime", "desc").limit(20)
      );
      r(this.chatCol.valueChanges({ idField: "gomdon_id" }));
    });
  }

  async getOrders() {
    const user = this.getUser();
    const uid = user.uid;
    const info: any = (
      await this.afs.firestore.collection("users").doc(uid).get()
    ).data();
    const stock = info.isMemberOf ? info.isMemberOf.uid : uid;
    this.orders = this.afs.collection("sells", (ref) =>
      ref
        .where("gomdon_status", "==", 1)
        .where("stock.uid", "==", stock)
        .where("set_picked", "==", true)
    );
    return this.orders.valueChanges();
  }

  async updateSell(id: string, data: any) {
    await this.afs.collection("sells").doc(id).update(data);
  }

  getMiliSec(date?: Date) {
    const d = date ? new Date(date).getTime() : new Date().getTime();
    // tslint:disable-next-line: no-bitwise
    return (d / 1000) >> 0;
  }

  async setChat(content: string) {
    const user = this.info;
    await this.afs
      .collection("chats")
      .doc(this.afs.createId())
      .set({
        content,
        from: {
          name: user.displayName,
          uid: user.uid,
        },
        gomdon_ctime: this.getMiliSec(),
      } as IChat);
  }

  loadMoreChat(startAtCtime: number) {
    return new Promise((r) => {
      firebase
        .firestore()
        .collection("chats")
        .orderBy("gomdon_ctime", "desc")
        .startAt(startAtCtime)
        .limit(10)
        .get()
        .then((docs) => {
          const datas = [];
          docs.forEach((doc) => {
            const obj = doc.data();
            obj.id = doc.id;
            datas.push(obj);
          });
          r(datas);
        });
    });
  }

  getUser() {
    return firebase.auth().currentUser;
  }
  async deleteAllPicks() {
    // Get a new write batch
    const uid = this.getUser().uid;
    const batch = firebase.firestore().batch();
    const colRef = firebase.firestore().collection("pick_models");
    const docs = await colRef.where("uid", "==", uid).get();
    docs.forEach((doc) => {
      batch.delete(colRef.doc(doc.id));
    });
    await batch.commit();
  }
}
