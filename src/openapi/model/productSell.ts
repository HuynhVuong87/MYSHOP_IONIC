/**
 * Gom Don API
 * Gom Don API.
 *
 * The version of the OpenAPI document: 1.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


export interface ProductSell { 
    cmt_count?: number;
    cat_id?: number;
    currency?: string;
    shop_id?: number;
    snapshot_id: number;
    images: Array<string>;
    price_before_discount?: string;
    estimated_days?: number;
    sku: string;
    liked_count?: number;
    branch?: string;
    price: string;
    stock: number;
    status?: number;
    description?: string;
    brand?: string;
    sold: number;
    item_id: number;
    condition?: number;
    ctime?: number;
    name: string;
    is_pre_order?: boolean;
}
