// apiRoutes.ts

type HttpMethod = 'GET' | 'POST';

interface ApiRoute {
    method: HttpMethod;
    path: string;                   // Full path of the route
    description?: string;           // Optional description for clarity
}

// Object of API routes
const apiRoutes: { [key: string]: ApiRoute } = {
    paymentInitiate: {
        method: 'POST',
        path: '/api/v1/service/payment/initiate',
        description: 'Initiate a payment'
    },
    paymentCollectionTransaction: {
        method: 'POST',
        path: '/api/v1/service/payment/collection/transaction',
        description: 'Process transaction collection'
    },
    paymentCollectionDetails: {
        method: 'GET',
        path: '/api/v1/service/payment/collection/transaction/details',
        description: 'Get transaction details'
    },
    resolvePendingTransaction: {
        method: 'GET',
        path: '/api/v1/service/payment/collection/transaction/resolve',
        description: 'Resolve pending transactions'
    },
    testWebhook: {
        method: 'POST',
        path: '/api/v1/service/webhook/test',
        description: 'Test webhook'
    },
    
    /** Business withdrawals route */
    payout: {
        method: 'POST',
        path: '/api/v1/service/payment/payout',
        description: 'Process withdrawal'
    },
    payoutBalance: {
        method: 'GET',
        path: '/api/v1/service/payment/payout-balance',
        description: 'Get payout balance'
    },

    /** Cash Craft Endpoints */
    cashCraftInitiate: {
        method: 'POST',
        path: '/api/v1/service/payment/cash-craft/initiate',
        description: 'Initiate cash craft'
    },
    cashCraftFee: {
        method: 'POST',
        path: '/api/v1/service/payment/cash-craft/fee',
        description: 'Get cash craft fee'
    },
    resolveCashCraft: {
        method: 'GET',
        path: '/api/v1/service/payment/cash-craft/resolve',
        description: 'Resolve cash craft payout'
    },
    cashCraftDetails: {
        method: 'GET',
        path: '/api/v1/service/payment/cash-craft/details',
        description: 'Get cash craft details'
    },

    /** Fund request routes */
    fundRequest: {
        method: 'POST',
        path: '/api/v1/service/request/fund',
        description: 'Request funds link'
    },
    fundRequestStatus: {
        method: 'POST',
        path: '/api/v1/service/request/fund/status',
        description: 'Get fund request status'
    },
    processFundRequest: {
        method: 'POST',
        path: '/api/v1/service/request/process/username/:link',
        description: 'Process fund request by username'
    },
    rejectFundRequest: {
        method: 'GET',
        path: '/api/v1/service/request/reject/username/:link',
        description: 'Reject fund request by username'
    },

    /** Users wallet routes */
    walletCreate: {
        method: 'POST',
        path: '/api/v1/service/wallet/create',
        description: 'Create a new wallet'
    },
    walletDetails: {
        method: 'GET',
        path: '/api/v1/service/wallet/details',
        description: 'Get wallet details'
    },
    walletCustomers: {
        method: 'GET',
        path: '/api/v1/service/wallet/customers',
        description: 'Get wallet customers'
    },
    walletWithdrawal: {
        method: 'POST',
        path: '/api/v1/service/wallet/withdrawal',
        description: 'Withdraw from wallet'
    },
    internalTransfer: {
        method: 'POST',
        path: '/api/v1/service/wallet/internal/transfer',
        description: 'Internal wallet transfer'
    },
    walletTransactions: {
        method: 'GET',
        path: '/api/v1/service/wallet/transactions',
        description: 'List wallet transactions'
    },

    /** General Route */
    bankList: {
        method: 'GET',
        path: '/api/v1/service/general/bank-list',
        description: 'Get list of banks'
    },
    bankAccountDetail: {
        method: 'GET',
        path: '/api/v1/service/general/bank-account-detail',
        description: 'Get bank account details'
    },

    /** Bills */
    billCategories: {
        method: 'GET',
        path: '/api/v1/service/bills/category/list',
        description: 'Get list of bill categories'
    },
    billList: {
        method: 'GET',
        path: '/api/v1/service/bills/list',
        description: 'Get list of bills'
    },
    billItemDetails: {
        method: 'POST',
        path: '/api/v1/service/bills/item/details',
        description: 'Get bill item details'
    },
    billPay: {
        method: 'POST',
        path: '/api/v1/service/bills/item/pay',
        description: 'Pay bill item'
    },
    billTransactionStatus: {
        method: 'GET',
        path: '/api/v1/service/bills/status',
        description: 'Get bill transaction status'
    },

    /** Card Payments */
    cardPayment: {
        method: 'POST',
        path: '/api/v1/service/card/process/pay',
        description: 'Process card payment'
    },
    cardTransactionStatus: {
        method: 'GET',
        path: '/api/v1/service/card/transaction/status',
        description: 'Get card transaction status'
    }
};

export default apiRoutes;