import { BillDetailsRequest, BillListRequest, CashCraftRequest, BillPaymentRequest, GetRequestParam, PostRequestParam, ReferenceGeneratorParam, VelvConstructorParam, WebhookTestRequest, BankAccountDetailsReq, FundRequestStatusReq, InitiateBankTransferRequest, InitiatePaymentRequest, PaymentDetailsRequest, PayVirtualAccountRequest, RequestFundRequest, TransactionDetailsReq } from "../model/models";
export default class Velv {
    baseUrl: string;
    secretKey: string;
    publicKey: string;
    encryptionKey: string;
    referenceId: string;
    token: string;
    axiosInstance: import("axios").AxiosInstance;
    constructor({ secretKey, publicKey, encryptionKey }: VelvConstructorParam);
    generateReferenceId({ referenceId }: ReferenceGeneratorParam): void;
    encryptionEngine(): Promise<void>;
    processPostRequest({ endpoint, data, referenceId, idempotencyKey }: PostRequestParam, enableIdempotency?: boolean): Promise<any>;
    processGetRequest({ endpoint, referenceId }: GetRequestParam): Promise<any>;
    payVirtualAccount({ referenceId, body }: {
        referenceId?: string;
        body: PayVirtualAccountRequest;
    }): Promise<any>;
    paymentDetails({ referenceId, body }: {
        referenceId?: string;
        body: PaymentDetailsRequest;
    }): Promise<any>;
    initiatePayment({ referenceId, body }: {
        referenceId?: string;
        body: InitiatePaymentRequest;
    }): Promise<any>;
    webhookTest({ body, referenceId }: {
        body?: WebhookTestRequest;
        referenceId?: string;
    }): Promise<any>;
    requestFund({ referenceId, body }: {
        referenceId?: string;
        body: RequestFundRequest;
    }): Promise<any>;
    fundRequestStatus({ referenceId, body }: {
        referenceId?: string;
        body: FundRequestStatusReq;
    }): Promise<any>;
    initiateBankTransfer({ referenceId, body, idempotencyKey }: {
        referenceId?: string;
        body: InitiateBankTransferRequest;
        idempotencyKey: string;
    }): Promise<any>;
    balance({ referenceId }: ReferenceGeneratorParam): Promise<any>;
    resolvePayoutStatus({ referenceId, body }: {
        referenceId?: string;
        body: TransactionDetailsReq;
    }): Promise<any>;
    bankList({ referenceId }: ReferenceGeneratorParam): Promise<any>;
    bankAccountDetails({ referenceId, body }: {
        referenceId?: string;
        body: BankAccountDetailsReq;
    }): Promise<any>;
    billCategories({ referenceId }: ReferenceGeneratorParam): Promise<any>;
    billList({ referenceId, body }: {
        referenceId?: string;
        body: BillListRequest;
    }): Promise<any>;
    billDetails({ referenceId, body }: {
        referenceId?: string;
        body: BillDetailsRequest;
    }): Promise<any>;
    payBill({ referenceId, body }: {
        referenceId?: string;
        body: BillPaymentRequest;
    }): Promise<any>;
    billTransactionStatus({ referenceId, body }: {
        referenceId?: string;
        body: FundRequestStatusReq;
    }): Promise<any>;
    cashCraftDetails({ referenceId, body }: {
        referenceId?: string;
        body: TransactionDetailsReq;
    }): Promise<any>;
    cashCraftManualResolve({ referenceId, body }: {
        referenceId?: string;
        body: TransactionDetailsReq;
    }): Promise<any>;
    cashCraftConfirmFee({ referenceId, body }: {
        referenceId?: string;
        body: CashCraftRequest;
    }): Promise<any>;
    cashCraftInitiate({ referenceId, body }: {
        referenceId?: string;
        body: CashCraftRequest;
    }): Promise<any>;
}
