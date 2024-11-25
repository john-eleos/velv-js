"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const crypto_js_1 = __importDefault(require("crypto-js"));
const nanoid_1 = require("nanoid");
const apiroutes_1 = __importDefault(require("../values/apiroutes"));
class Velv {
    constructor({ secretKey, publicKey, encryptionKey }) {
        this.baseUrl = `https://api.velvpay.com/api/v1/service`;
        this.secretKey = '';
        this.publicKey = '';
        this.encryptionKey = '';
        this.referenceId = '';
        this.token = '';
        this.axiosInstance = axios_1.default.create({
            baseURL: this.baseUrl,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        this.secretKey = secretKey;
        this.publicKey = publicKey;
        this.encryptionKey = encryptionKey;
    }
    generateReferenceId({ referenceId }) {
        var _a;
        this.referenceId = (_a = referenceId === null || referenceId === void 0 ? void 0 : referenceId.trim()) !== null && _a !== void 0 ? _a : `VAS-${(0, nanoid_1.nanoid)(10)}`;
    }
    encryptionEngine() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            // check to make sure the authorization strings trimmed are not undefined
            const valid = typeof ((_a = this.secretKey) === null || _a === void 0 ? void 0 : _a.trim()) !== 'undefined' && typeof ((_b = this.publicKey) === null || _b === void 0 ? void 0 : _b.trim()) !== 'undefined' && typeof ((_c = this.referenceId) === null || _c === void 0 ? void 0 : _c.trim()) !== 'undefined';
            if (!valid) {
                throw new Error("required keys are not set please make sure you have set them");
            }
            const authorization = `${this.secretKey + this.publicKey + this.referenceId}`;
            this.token = yield crypto_js_1.default.AES.encrypt(authorization, this.encryptionKey).toString();
        });
    }
    processPostRequest(_a) {
        return __awaiter(this, arguments, void 0, function* ({ endpoint, data, referenceId }) {
            this.generateReferenceId({ referenceId: referenceId });
            yield this.encryptionEngine();
            // Set custom headers
            this.axiosInstance.defaults.headers['api-key'] = this.token; // Use the token as the API key
            this.axiosInstance.defaults.headers['public-key'] = this.publicKey;
            this.axiosInstance.defaults.headers['reference-id'] = this.referenceId;
            try {
                const response = yield this.axiosInstance.post(endpoint, data);
                return response.data; // Return the response data directly
            }
            catch (error) {
                console.error('POST request failed:', error);
                throw error; // Propagate the error
            }
        });
    }
    processGetRequest(_a) {
        return __awaiter(this, arguments, void 0, function* ({ endpoint, referenceId }) {
            this.generateReferenceId({ referenceId: referenceId });
            yield this.encryptionEngine();
            // Set custom headers
            this.axiosInstance.defaults.headers['api-key'] = this.token; // Use the token as the API key
            this.axiosInstance.defaults.headers['public-key'] = this.publicKey;
            this.axiosInstance.defaults.headers['reference-id'] = this.referenceId;
            try {
                const response = yield this.axiosInstance.get(endpoint);
                return response.data; // Return the response data directly
            }
            catch (error) {
                console.error('GET request failed:', error);
                throw error; // Propagate the error
            }
        });
    }
    payVirtualAccount(_a) {
        return __awaiter(this, arguments, void 0, function* ({ referenceId, body }) {
            const info = apiroutes_1.default.paymentCollectionTransaction;
            try {
                const response = yield this.processPostRequest({ endpoint: info.path, referenceId: referenceId, data: body });
                return response;
            }
            catch (error) {
                console.error('Failed to send payment collection transaction:', error);
                throw error; // Propagate the error
            }
        });
    }
    paymentDetails(_a) {
        return __awaiter(this, arguments, void 0, function* ({ referenceId, body }) {
            const info = apiroutes_1.default.paymentCollectionDetails;
            try {
                const response = yield this.processGetRequest({ referenceId: referenceId, endpoint: `${info.path}?transaction_id=${body.transactionId}&send_webhook=${body.sendWebhook}&accounNo=${body.accountNumber}&channel=${body.channel}&method=${body.method}&status=${body.status}` });
                return response;
            }
            catch (error) {
                console.error('Failed to get payment collection details:', error);
                throw error; // Propagate the error
            }
        });
    }
    initiatePayment(_a) {
        return __awaiter(this, arguments, void 0, function* ({ referenceId, body }) {
            const info = apiroutes_1.default.paymentInitiate;
            try {
                const response = yield this.processPostRequest({ endpoint: info.path, referenceId: referenceId, data: body });
                return response;
            }
            catch (error) {
                console.error('Failed to initiate payment:', error);
                throw error; // Propagate the error
            }
        });
    }
    webhookTest(_a) {
        return __awaiter(this, arguments, void 0, function* ({ body, referenceId }) {
            const info = apiroutes_1.default.testWebhook;
            try {
                const response = yield this.processPostRequest({ endpoint: info.path, referenceId: referenceId, data: body });
                return response;
            }
            catch (error) {
                console.error('Failed to send test webhook:', error);
                throw error; // Propagate the error
            }
        });
    }
    requestFund(_a) {
        return __awaiter(this, arguments, void 0, function* ({ referenceId, body }) {
            const info = apiroutes_1.default.fundRequest;
            try {
                const response = yield this.processPostRequest({
                    endpoint: info.path,
                    referenceId: referenceId,
                    data: body
                });
                return response;
            }
            catch (error) {
                console.error('Failed to request fund:', error);
                throw error; // Propagate the error
            }
        });
    }
    fundRequestStatus(_a) {
        return __awaiter(this, arguments, void 0, function* ({ referenceId, body }) {
            const info = apiroutes_1.default.fundRequestStatus;
            try {
                const response = yield this.processPostRequest({
                    endpoint: info.path,
                    referenceId: referenceId,
                    data: body
                });
                return response;
            }
            catch (error) {
                console.error('Failed to get fund request status:', error);
                throw error; // Propagate the error
            }
        });
    }
    initiateBankTransfer(_a) {
        return __awaiter(this, arguments, void 0, function* ({ referenceId, body }) {
            const info = apiroutes_1.default.bankTransfer; // Update to your specific API route
            try {
                const response = yield this.processPostRequest({
                    endpoint: info.path,
                    referenceId: referenceId,
                    data: body
                });
                return response;
            }
            catch (error) {
                console.error("Failed to initiate bank transfer:", error);
                throw error; // Propagate the error
            }
        });
    }
    balance(_a) {
        return __awaiter(this, arguments, void 0, function* ({ referenceId }) {
            const info = apiroutes_1.default.payoutBalance;
            try {
                const response = yield this.processGetRequest({ referenceId: referenceId, endpoint: info.path });
                return response;
            }
            catch (error) {
                console.error("Failed to get balance:", error);
                throw error; // Propagate the error
            }
        });
    }
    resolvePayoutStatus(_a) {
        return __awaiter(this, arguments, void 0, function* ({ referenceId, body }) {
            const info = apiroutes_1.default.resolvePendingTransaction;
            try {
                const response = yield this.processGetRequest({ referenceId: referenceId, endpoint: `${info.path}?transaction_id=${body.transactionId}` });
                return response;
            }
            catch (error) {
                console.error("Failed to get balance:", error);
                throw error; // Propagate the error
            }
        });
    }
    bankList(_a) {
        return __awaiter(this, arguments, void 0, function* ({ referenceId }) {
            const info = apiroutes_1.default.bankList; // Assuming apiRoutes is defined elsewhere
            try {
                const response = yield this.processGetRequest({ referenceId: referenceId, endpoint: info.path });
                return response; // Cast the response to BankResponse
            }
            catch (error) {
                console.error('Failed to get banks:', error);
                throw error; // Propagate the error
            }
        });
    }
    bankAccountDetails(_a) {
        return __awaiter(this, arguments, void 0, function* ({ referenceId, body }) {
            const info = apiroutes_1.default.bankAccountDetail;
            try {
                const response = yield this.processGetRequest({ referenceId: referenceId, endpoint: `${info.path}?account_number=${body.accountNumber}&bank_code=${body.bankCode}` });
                return response;
            }
            catch (error) {
                console.error('Failed to get bank account details:', error);
                throw error; // Propagate the error
            }
        });
    }
    billCategories(_a) {
        return __awaiter(this, arguments, void 0, function* ({ referenceId }) {
            const info = apiroutes_1.default.billCategories;
            try {
                const response = yield this.processGetRequest({ referenceId: referenceId, endpoint: info.path });
                return response;
            }
            catch (error) {
                console.error("Failed to get balance:", error);
                throw error; // Propagate the error
            }
        });
    }
    billList(_a) {
        return __awaiter(this, arguments, void 0, function* ({ referenceId, body }) {
            const info = apiroutes_1.default.billList;
            try {
                const response = yield this.processGetRequest({ referenceId: referenceId, endpoint: `${info.path}?category=${body.category}` });
                return response;
            }
            catch (error) {
                console.error("Failed to get balance:", error);
                throw error; // Propagate the error
            }
        });
    }
    billDetails(_a) {
        return __awaiter(this, arguments, void 0, function* ({ referenceId, body }) {
            const info = apiroutes_1.default.billItemDetails;
            try {
                const response = yield this.processPostRequest({
                    endpoint: info.path,
                    referenceId: referenceId,
                    data: body
                });
                return response;
            }
            catch (error) {
                console.error("Failed to confirm cash craft fee:", error);
                throw error;
            }
        });
    }
    payBill(_a) {
        return __awaiter(this, arguments, void 0, function* ({ referenceId, body }) {
            const info = apiroutes_1.default.billPay;
            try {
                const response = yield this.processPostRequest({
                    endpoint: info.path,
                    referenceId: referenceId,
                    data: body
                });
                return response;
            }
            catch (error) {
                console.error("Failed to confirm cash craft fee:", error);
                throw error;
            }
        });
    }
    billTransactionStatus(_a) {
        return __awaiter(this, arguments, void 0, function* ({ referenceId, body }) {
            const info = apiroutes_1.default.billTransactionStatus;
            try {
                const response = yield this.processGetRequest({ referenceId: referenceId, endpoint: `${info.path}?reference=${body.reference}` });
                return response;
            }
            catch (error) {
                console.error("Failed to get balance:", error);
                throw error; // Propagate the error
            }
        });
    }
    cashCraftDetails(_a) {
        return __awaiter(this, arguments, void 0, function* ({ referenceId, body }) {
            const info = apiroutes_1.default.cashCraftDetails;
            try {
                const response = yield this.processGetRequest({ referenceId: referenceId, endpoint: `${info.path}?transaction_id=${body.transactionId}` });
                return response;
            }
            catch (error) {
                console.error("Failed to get balance:", error);
                throw error; // Propagate the error
            }
        });
    }
    cashCraftManualResolve(_a) {
        return __awaiter(this, arguments, void 0, function* ({ referenceId, body }) {
            const info = apiroutes_1.default.resolveCashCraft;
            try {
                const response = yield this.processGetRequest({ referenceId: referenceId, endpoint: `${info.path}?txId=${body.transactionId}` });
                return response;
            }
            catch (error) {
                console.error("Failed to get balance:", error);
                throw error; // Propagate the error
            }
        });
    }
    cashCraftConfirmFee(_a) {
        return __awaiter(this, arguments, void 0, function* ({ referenceId, body }) {
            const info = apiroutes_1.default.cashCraftFee;
            try {
                const response = yield this.processPostRequest({
                    endpoint: info.path,
                    referenceId: referenceId,
                    data: body
                });
                return response;
            }
            catch (error) {
                console.error("Failed to confirm cash craft fee:", error);
                throw error;
            }
        });
    }
    cashCraftInitiate(_a) {
        return __awaiter(this, arguments, void 0, function* ({ referenceId, body }) {
            const info = apiroutes_1.default.cashCraftInitiate;
            try {
                const response = yield this.processPostRequest({
                    endpoint: info.path,
                    referenceId: referenceId,
                    data: body
                });
                return response;
            }
            catch (error) {
                console.error("Failed to confirm cash craft fee:", error);
                throw error;
            }
        });
    }
}
exports.default = Velv;
