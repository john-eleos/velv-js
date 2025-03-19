export interface WebhookTestRequest {
    [key: string]: any; // Allows any key-value pairs
}


export interface VelvConstructorParam{secretKey: string, publicKey:string, encryptionKey:string}
export interface ReferenceGeneratorParam{referenceId?:string}
export interface PostRequestParam{endpoint: string, data: any, referenceId?:string, idempotencyKey?:string}
export interface GetRequestParam{endpoint: string,referenceId?:string}
export interface Account {
    account_number: string;
    bank_code: string;
}

export interface BillDetailsRequest {
    billerId: string; // This is returned from the bill list as `id`
    divisionId: string; // This is returned from the bill list as `division`
    productId: string; // This is returned from the bill list as `product`
}



export interface BillPaymentRequest {
    billerId: string; // This is returned from the bill list as `billerId`
    amount: number; // The amount to pay (in Kobo)
    productId: string; // This is returned from the bill list as `productId`
    paymentItem: string; // This is returned from the bill list as `paymentCode`
    category: string; // Bill category
    billId: string; // Electricity meter number, phone number, TV cable ID
    division: string; // This is returned from the bill list as `division`
}


export interface BillListRequest{category:string}
export interface Beneficiary {
    bankCode: string;
    accountNumber: string;
    amount: number;
}

export interface CashCraftRequest {
    amount: number; // Minimum 100, Required
    email: string; // Optional, must be a valid email
    isNaira?: boolean | null; // Optional, can be `null` or `''`
    validityTime?: number | null; // Optional, between 20 and 60, can be `null` or `''`
    webhook_url?: string | null; // Optional, can be `null` or `''`
    description?: string | null; // Optional, can be `null` or `''`
    beneficiaries: Beneficiary[]; // Array of beneficiaries (min 1, max 5)
}
export interface PayVirtualAccountRequest{amount: number, isNaira?: boolean, email: string, validityTime?: number}
export interface PaymentDetailsRequest{transactionId?: string, sendWebhook?: boolean, accountNumber?: string, channel?: string, method?: string, status?: string}
export interface InitiatePaymentRequest{amount: number, isNaira?: boolean, title: string, description: string, redirectUrl?: string, chargeCustomer?: boolean, postPaymentInstructions?: string}
export interface RequestFundRequest{
    amount: number; // Amount in kobo
    isNaira?: boolean; // Optional
    type: "user-to-business" | "user-to-user"; // Mandatory
    senderEmail: string; // Mandatory
    receiverEmail: string; // Mandatory
    paymentName: string; // Request title
    description: string; // Request description
    metadata?: object; // Optional custom keys
}

export interface FundRequestStatusReq{reference: string}
export interface TransactionDetailsReq{transactionId:string}
export interface InitiateBankTransferRequest{
    amount: number; // Amount in kobo
    isNaira?: boolean; // Optional
    bankCode: string; // Bank code (Mandatory)
    bankName: string; // Bank name (Mandatory)
    accountNumber: string; // Account number (Mandatory)
    accountName: string; // Account name (Mandatory)
    description: string; // Transfer description (Mandatory)
    pin: number; // Transaction pin (Mandatory)
}
export interface BankAccountDetailsReq{accountNumber: string, bankCode: string}
// models/Bank.ts

export interface Bank {
    id: number;
    code: string;
    name: string;
    logo: string;
    created: string; // Consider using Date if you plan to convert this to a Date object later
}

export interface BankResponse {
    data: Bank[];
}



export interface AccountInfoData {
    accountName: string; // This will hold the name from accountLookUp.data.name
}

// models/BillCategory.ts
//1
export interface BillCategory {
    category: string; // Represents the category name
}

export type BillCategoryList = BillCategory[]; // Represents an array of BillCategory

//2
export interface Product {
    id: string;                      // Unique identifier for the product
    name: string;                    // Name of the product
    division: string;                // Division the product belongs to
    product: string;                 // Product code
    category: string;                // Category of the product
    convenienceFee?: string;         // Optional convenience fee (not present for all products)
}

export type ProductList = Product[]; // Represents an array of Product objects



//3
export interface PaymentItem {
    id: string;                     // Unique identifier for the payment item
    billerid: string;               // Identifier for the biller
    amount: string;                 // Amount for the payment item
    code: string;                   // Code associated with the payment item
    paymentitemname: string;        // Name of the payment item
    productId: string;              // Associated product ID
    paymentitemid: string;          // ID for the payment item
    currencySymbol: string;         // Symbol for the currency
    isAmountFixed: string;          // Indicates if the amount is fixed (boolean as string)
    itemFee: string;                // Fee associated with the item
    itemCurrencySymbol: string;     // Currency symbol for the item fee
    pictureId: string;              // ID for the picture associated with the item
    paymentCode: string;            // Payment code for the item
    sortOrder: string;              // Order in which the item should be sorted
    billerType: string;             // Type of the biller
    payDirectitemCode: string;      // Direct payment item code
    currencyCode: string;           // Code for the currency
    division: string;               // Division associated with the item
    categoryid: string;             // ID for the category of the item
    createdDate: string;            // Date the item was created
}

export interface PaymentItemsResponse {
    paymentitems: PaymentItem[];    // Array of payment items
}