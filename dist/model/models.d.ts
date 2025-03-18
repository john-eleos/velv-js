export interface WebhookTestRequest {
    [key: string]: any;
}
export interface VelvConstructorParam {
    secretKey: string;
    publicKey: string;
    encryptionKey: string;
}
export interface ReferenceGeneratorParam {
    referenceId?: string;
}
export interface PostRequestParam {
    endpoint: string;
    data: any;
    referenceId?: string;
    idempotencyKey?: string;
}
export interface GetRequestParam {
    endpoint: string;
    referenceId?: string;
}
export interface Account {
    account_number: string;
    bank_code: string;
}
export interface BillDetailsRequest {
    billerId: string;
    divisionId: string;
    productId: string;
}
export interface BillPaymentRequest {
    billerId: string;
    amount: number;
    productId: string;
    paymentItem: string;
    category: string;
    billId: string;
    division: string;
}
export interface BillListRequest {
    category: string;
}
export interface Beneficiary {
    bankCode: string;
    accountNumber: string;
    amount: number;
}
export interface CashCraftRequest {
    amount: number;
    email: string;
    isNaira?: boolean | null;
    validityTime?: number | null;
    webhook_url?: string | null;
    description?: string | null;
    beneficiaries: Beneficiary[];
}
export interface PayVirtualAccountRequest {
    amount: number;
    isNaira?: boolean;
    email: string;
    validityTime?: number;
}
export interface PaymentDetailsRequest {
    transactionId?: string;
    sendWebhook?: boolean;
    accountNumber?: string;
    channel?: string;
    method?: string;
    status?: string;
}
export interface InitiatePaymentRequest {
    amount: number;
    isNaira?: boolean;
    title: string;
    description: string;
    redirectUrl?: string;
    chargeCustomer?: boolean;
    postPaymentInstructions?: string;
}
export interface RequestFundRequest {
    amount: number;
    isNaira?: boolean;
    type: "user-to-business" | "user-to-user";
    senderEmail: string;
    receiverEmail: string;
    paymentName: string;
    description: string;
    metadata?: object;
}
export interface FundRequestStatusReq {
    reference: string;
}
export interface TransactionDetailsReq {
    transactionId: string;
}
export interface InitiateBankTransferRequest {
    amount: number;
    isNaira?: boolean;
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    description: string;
    pin: number;
}
export interface BankAccountDetailsReq {
    accountNumber: string;
    bankCode: string;
}
export interface Bank {
    id: number;
    code: string;
    name: string;
    logo: string;
    created: string;
}
export interface BankResponse {
    data: Bank[];
}
export interface AccountInfoData {
    accountName: string;
}
export interface BillCategory {
    category: string;
}
export type BillCategoryList = BillCategory[];
export interface Product {
    id: string;
    name: string;
    division: string;
    product: string;
    category: string;
    convenienceFee?: string;
}
export type ProductList = Product[];
export interface PaymentItem {
    id: string;
    billerid: string;
    amount: string;
    code: string;
    paymentitemname: string;
    productId: string;
    paymentitemid: string;
    currencySymbol: string;
    isAmountFixed: string;
    itemFee: string;
    itemCurrencySymbol: string;
    pictureId: string;
    paymentCode: string;
    sortOrder: string;
    billerType: string;
    payDirectitemCode: string;
    currencyCode: string;
    division: string;
    categoryid: string;
    createdDate: string;
}
export interface PaymentItemsResponse {
    paymentitems: PaymentItem[];
}
