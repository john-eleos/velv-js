import axios from "axios";
import cryptoJs from "crypto-js";
import { nanoid } from "nanoid";
import apiRoutes from "../values/apiroutes";
import {BillDetailsRequest, BillListRequest, CashCraftRequest, BankResponse, BillPaymentRequest , GetRequestParam, PostRequestParam, ReferenceGeneratorParam, VelvConstructorParam, WebhookTestRequest, BankAccountDetailsReq, FundRequestStatusReq, InitiateBankTransferRequest, InitiatePaymentRequest, PaymentDetailsRequest, PayVirtualAccountRequest, RequestFundRequest, TransactionDetailsReq } from "../model/models";


export default class Velv {
    baseUrl =  `https://api.velvpay.com`
    secretKey = ''
    publicKey = ''
    encryptionKey = ''
    referenceId = ''
    token = ''
    axiosInstance = axios.create({
        baseURL: this.baseUrl,
        headers: {
            'Content-Type': 'application/json'
        }
    })


    
    constructor({secretKey,publicKey,encryptionKey}: VelvConstructorParam) {
        this.secretKey = secretKey
        this.publicKey = publicKey
        this.encryptionKey = encryptionKey
        
    }



    
    generateReferenceId({referenceId}:ReferenceGeneratorParam){
        this.referenceId = referenceId?.trim() ?? `VAS-${nanoid(10)}`
    }


    
    async encryptionEngine(){
        // check to make sure the authorization strings trimmed are not undefined
        const valid = typeof this.secretKey?.trim() !== 'undefined' && typeof this.publicKey?.trim() !== 'undefined' && typeof this.referenceId?.trim() !== 'undefined'
        if(!valid) {
            throw new Error("required keys are not set please make sure you have set them");
        }
        const authorization = `${this.secretKey+this.publicKey+this.referenceId}`
        this.token = await cryptoJs.AES.encrypt(authorization,this.encryptionKey).toString()
    }


    
    async processPostRequest({endpoint, data, referenceId, idempotencyKey}:PostRequestParam, enableIdempotency:boolean=false) {
        this.generateReferenceId({referenceId:referenceId})
        await this.encryptionEngine();

        // Set custom headers
        this.axiosInstance.defaults.headers['api-key'] = this.token; // Use the token as the API key
        this.axiosInstance.defaults.headers['public-key'] = this.publicKey;
        this.axiosInstance.defaults.headers['reference-id'] = this.referenceId;

        if (enableIdempotency) {
            if (!idempotencyKey) {
                throw new Error("POST request failed: Idempotency key is required")
            }
            this.axiosInstance.defaults.headers['idempotencykey'] = idempotencyKey
        }
        try {
            const response = await this.axiosInstance.post(endpoint, data);
            return response.data; // Return the response data directly
        } catch (error) {
            console.error('POST request failed:', error);
            throw error; // Propagate the error
        }
    }

    
    async processGetRequest({endpoint,referenceId}:GetRequestParam) {
        
        this.generateReferenceId({referenceId:referenceId})
        await this.encryptionEngine();

        // Set custom headers
        this.axiosInstance.defaults.headers['api-key'] = this.token; // Use the token as the API key
        this.axiosInstance.defaults.headers['public-key'] = this.publicKey;
        this.axiosInstance.defaults.headers['reference-id'] = this.referenceId;

        try {
            const response = await this.axiosInstance.get(endpoint);
            return response.data; // Return the response data directly
        } catch (error) {
            console.error('GET request failed:', error);
            throw error; // Propagate the error
        }
    }



    

    async payVirtualAccount({referenceId, body}:{referenceId?: string, body: PayVirtualAccountRequest}){
        const info = apiRoutes.paymentCollectionTransaction
        try{
            const response = await this.processPostRequest({endpoint: info.path, referenceId: referenceId, data: body});
            return response;
        }catch(error){
            console.error('Failed to send payment collection transaction:', error);
            throw error; // Propagate the error
        }
    }

    async paymentDetails({referenceId, body}:{referenceId?: string, body:PaymentDetailsRequest}){
        const info = apiRoutes.paymentCollectionDetails
        try{
            const response = await this.processGetRequest({referenceId: referenceId, endpoint: `${info.path}?transaction_id=${body?.transactionId}&send_webhook=${body?.sendWebhook}&accounNo=${body?.accountNumber}&channel=${body?.channel}&method=${body?.method}&status=${body?.status}`});
            return response;
        }catch(error){
            console.error('Failed to get payment collection details:', error);
            throw error; // Propagate the error
        }
    }

    async initiatePayment({referenceId, body}:{referenceId?: string, body:InitiatePaymentRequest}){
        const info = apiRoutes.paymentInitiate
        try{
            const response = await this.processPostRequest({endpoint: info.path, referenceId: referenceId, data: body});
            return response;
        }catch(error){
            console.error('Failed to initiate payment:', error);
            throw error; // Propagate the error
        }
    }

    async webhookTest({body, referenceId}:{body?:WebhookTestRequest, referenceId?: string}){
        const info = apiRoutes.testWebhook;
         try{
             const response = await this.processPostRequest({endpoint: info.path, referenceId: referenceId, data: body});
             return response;
         }catch(error){
             console.error('Failed to send test webhook:', error);
             throw error; // Propagate the error
         }
    }

    async requestFund({referenceId, body}:{referenceId?: string, body:RequestFundRequest}){
        const info = apiRoutes.fundRequest;
        try{
            const response = await this.processPostRequest({
                endpoint: info.path,
                referenceId: referenceId,
                data: body
            })
            return response;
        }catch(error){
            console.error('Failed to request fund:', error);
            throw error; // Propagate the error
        }
    }

    async fundRequestStatus({referenceId, body}:{referenceId?: string, body:FundRequestStatusReq}){
        const info = apiRoutes.fundRequestStatus;
        try{
            const response = await this.processPostRequest({
                endpoint: info.path,
                referenceId: referenceId,
                data: body
            })
            return response;
        }catch(error){
            console.error('Failed to get fund request status:', error);
            throw error; // Propagate the error
        }
    }

    async initiateBankTransfer({referenceId, body, idempotencyKey}:{referenceId?: string, body:InitiateBankTransferRequest, idempotencyKey:string}) {
        const info = apiRoutes.payout; // Update to your specific API route
        try {
            const response = await this.processPostRequest({
                endpoint: info.path,
                referenceId: referenceId,
                data: body,
                idempotencyKey
            }, true);
            return response;
        } catch (error) {
            console.error("Failed to initiate bank transfer:", error);
            throw error; // Propagate the error
        }
    }
    
    async balance({referenceId}:ReferenceGeneratorParam) {
        const info = apiRoutes.payoutBalance
        try {
            const response = await this.processGetRequest({referenceId: referenceId, endpoint: info.path});
            return response;
        } catch (error) {
            console.error("Failed to get balance:", error);
            throw error; // Propagate the error
        }
    }

    async resolvePayoutStatus({referenceId, body}:{referenceId?: string, body:TransactionDetailsReq}){
        const info = apiRoutes.resolvePendingTransaction
        try {
            const response = await this.processGetRequest({referenceId: referenceId, endpoint: `${info.path}?transaction_id=${body.transactionId}`});
            return response;
        } catch (error) {
            console.error("Failed to get balance:", error);
            throw error; // Propagate the error
        }
    }



    

    

    async bankList({referenceId}:ReferenceGeneratorParam) {
        const info = apiRoutes.bankList; // Assuming apiRoutes is defined elsewhere
        try {
            const response = await this.processGetRequest({referenceId: referenceId, endpoint: info.path});
            return response; // Cast the response to BankResponse
        } catch (error) {
            console.error('Failed to get banks:', error);
            throw error; // Propagate the error
        }
    }

    async bankAccountDetails({referenceId, body}:{referenceId?: string, body:BankAccountDetailsReq}) {
        const info = apiRoutes.bankAccountDetail;
        try{
            const response = await this.processGetRequest({referenceId: referenceId, endpoint:`${info.path}?account_number=${body.accountNumber}&bank_code=${body.bankCode}`});
            return response;
        }catch(error){
            console.error('Failed to get bank account details:', error);
            throw error; // Propagate the error
        }
    }


    
    async billCategories({referenceId}:ReferenceGeneratorParam) {
        const info = apiRoutes.billCategories
        try {
            const response = await this.processGetRequest({referenceId: referenceId, endpoint: info.path});
            return response;
        } catch (error) {
            console.error("Failed to get balance:", error);
            throw error; // Propagate the error
        }
    }

    async billList({referenceId, body}:{referenceId?: string, body:BillListRequest}){
        const info = apiRoutes.billList
        try {
            const response = await this.processGetRequest({referenceId: referenceId, endpoint: `${info.path}?category=${body.category}`});
            return response;
        } catch (error) {
            console.error("Failed to get balance:", error);
            throw error; // Propagate the error
        }
    }


    async billDetails({referenceId, body}:{referenceId?: string, body:BillDetailsRequest}){
        const info = apiRoutes.billItemDetails
        try{
            const response = await this.processPostRequest({
                endpoint: info.path,
                referenceId: referenceId,
                data: body
            })
            return response;
        }catch(error){
            console.error("Failed to confirm cash craft fee:", error);
            throw error;
        }
    }    
    
    async payBill({referenceId, body}:{referenceId?: string, body:BillPaymentRequest}){
        const info = apiRoutes.billPay
        try{
            const response = await this.processPostRequest({
                endpoint: info.path,
                referenceId: referenceId,
                data: body
            })
            return response;
        }catch(error){
            console.error("Failed to confirm cash craft fee:", error);
            throw error;
        }
    }




    async billTransactionStatus({referenceId, body}:{referenceId?: string, body:FundRequestStatusReq}){
        const info = apiRoutes.billTransactionStatus
        try {
            const response = await this.processGetRequest({referenceId: referenceId, endpoint: `${info.path}?reference=${body.reference}`});
            return response;
        } catch (error) {
            console.error("Failed to get balance:", error);
            throw error; // Propagate the error
        }
    }


    




    async cashCraftDetails({referenceId, body}:{referenceId?: string, body:TransactionDetailsReq}){
        const info = apiRoutes.cashCraftDetails
        try {
            const response = await this.processGetRequest({referenceId: referenceId, endpoint: `${info.path}?transaction_id=${body.transactionId}`});
            return response;
        } catch (error) {
            console.error("Failed to get balance:", error);
            throw error; // Propagate the error
        }
    }

    async cashCraftManualResolve({referenceId, body}:{referenceId?: string, body:TransactionDetailsReq}){
        const info = apiRoutes.resolveCashCraft
        try {
            const response = await this.processGetRequest({referenceId: referenceId, endpoint: `${info.path}?txId=${body.transactionId}`});
            return response;
        } catch (error) {
            console.error("Failed to get balance:", error);
            throw error; // Propagate the error
        }
    }


    async cashCraftConfirmFee({referenceId, body}:{referenceId?: string, body:CashCraftRequest}){
        const info = apiRoutes.cashCraftFee
        try{
            const response = await this.processPostRequest({
                endpoint: info.path,
                referenceId: referenceId,
                data: body
            })
            return response;
        }catch(error){
            console.error("Failed to confirm cash craft fee:", error);
            throw error;
        }
    }

    async cashCraftInitiate({referenceId, body}:{referenceId?: string, body:CashCraftRequest}){
        const info = apiRoutes.cashCraftInitiate
        try{
            const response = await this.processPostRequest({
                endpoint: info.path,
                referenceId: referenceId,
                data: body
            })
            return response;
        }catch(error){
            console.error("Failed to confirm cash craft fee:", error);
            throw error;
        }
    }


}