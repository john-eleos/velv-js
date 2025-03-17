# Velv SDK

A JavaScript SDK for interacting with the **VelvPay API(https://bit.ly/velvapi)**, providing a simple and secure way to access VelvPay services.

---

## Installation

Install the Velv SDK via npm:

```bash
npm install velv-js
or 
yarn add velv-js
```

---

## Usage

### Importing the SDK

```javascript
import Velv from "velv-js";  //for ESM or

const Velv = require("velv-js") // for commonJS
```

### Initializing the SDK

```javascript
const velv = new Velv({
  secretKey: "your-secret-key",
  publicKey: "your-public-key",
  encryptionKey: "your-encryption-key",
});
```

---

## Methods

### General Methods

#### `generateReferenceId({ referenceId })`

Generates a unique reference ID.

- **Parameters:**
  - `referenceId` *(optional)*: Custom reference ID string.
- **Example:**
  ```javascript
  velv.generateReferenceId({ referenceId: "custom-reference" });
  ```

#### `encryptionEngine()`

Generates an encrypted token using `secretKey`, `publicKey`, and `referenceId`.

- **Example:**
  ```javascript
  await velv.encryptionEngine();
  ```

---

### HTTP Request Methods

#### `processPostRequest({ endpoint, data, referenceId })`

Handles a POST request to the VelvPay API.

- **Parameters:**
  - `endpoint` *(required)*: API endpoint.
  - `data` *(required)*: Request payload.
  - `referenceId` *(optional)*: Custom reference ID.
- **Example:**
  ```javascript
  const response = await velv.processPostRequest({
    endpoint: "/your-endpoint",
    data: { key: "value" },
  });
  ```

#### `processGetRequest({ endpoint, referenceId })`

Handles a GET request to the VelvPay API.

- **Parameters:**
  - `endpoint` *(required)*: API endpoint.
  - `referenceId` *(optional)*: Custom reference ID.
- **Example:**
  ```javascript
  const response = await velv.processGetRequest({
    endpoint: "/your-endpoint",
  });
  ```

---

### Payment Methods

#### `payVirtualAccount({ referenceId, body })`

Creates a virtual account for payment.

- **Parameters:**
  - `referenceId` *(optional)*: Custom reference ID.
  - `body` *(required)*: Request payload (`PayVirtualAccountRequest`).
- **Example:**
  ```javascript
  const response = await velv.payVirtualAccount({
    body: { amount: 5000, email: "test@example.com" },
  });
  ```

#### `paymentDetails({ referenceId, body })`

Fetches payment details.

- **Parameters:**
  - `referenceId` *(optional)*: Custom reference ID.
  - `body` *(required)*: Request payload (`PaymentDetailsRequest`).
- **Example:**
  ```javascript
  const response = await velv.paymentDetails({
    body: { transactionId: "txn-123" },
  });
  ```

---

### Fund Transfer Methods

#### `initiateBankTransfer({ referenceId, body })`

Initiates a bank transfer.

- **Parameters:**
  - `referenceId` *(optional)*: Custom reference ID.
  - `body` *(required)*: Request payload (`InitiateBankTransferRequest`).
- **Example:**
  ```javascript
  const response = await velv.initiateBankTransfer({
    body: {
      amount: 100000,
      bankCode: "001",
      accountNumber: "1234567890",
      pin: 1234,
    },
  });
  ```

#### `fundRequestStatus({ referenceId, body })`

Fetches the status of a fund request.

- **Parameters:**
  - `referenceId` *(optional)*: Custom reference ID.
  - `body` *(required)*: Request payload (`FundRequestStatusReq`).
- **Example:**
  ```javascript
  const response = await velv.fundRequestStatus({
    body: { reference: "fund-ref-123" },
  });
  ```

---

### Bills Payment Methods

#### `billCategories({ referenceId })`

Fetches bill categories.

- **Parameters:**
  - `referenceId` *(optional)*: Custom reference ID.
- **Example:**
  ```javascript
  const response = await velv.billCategories();
  ```

#### `billDetails({ referenceId, body })`

Fetches details of a specific bill item.

- **Parameters:**
  - `referenceId` *(optional)*: Custom reference ID.
  - `body` *(required)*: Request payload (`BillDetailsRequest`).
- **Example:**
  ```javascript
  const response = await velv.billDetails({
    body: { billerId: "biller-123", divisionId: "div-001", productId: "prod-456" },
  });
  ```

#### `payBill({ referenceId, body })`

Processes a bill payment.

- **Parameters:**
  - `referenceId` *(optional)*: Custom reference ID.
  - `body` *(required)*: Request payload (`BillPaymentRequest`).
- **Example:**
  ```javascript
  const response = await velv.payBill({
    body: {
      billerId: "biller-123",
      amount: 10000,
      productId: "prod-456",
      paymentItem: "item-001",
      category: "electricity",
      billId: "meter-789",
      division: "div-001",
    },
  });
  ```

---

## Error Handling

Errors are propagated to the caller. Wrap your calls in a `try-catch` block to handle errors:

```javascript
try {
  const response = await velv.payBill({
    body: { billerId: "123", amount: 1000 },
  });
  console.log(response);
} catch (error) {
  console.error("Error processing request:", error.message);
}
```

---

## Models

Refer to the `models` directory for details on request/response structures such as:

- `PayVirtualAccountRequest`
- `PaymentDetailsRequest`
- `InitiateBankTransferRequest`
- `FundRequestStatusReq`

---

## API Endpoints

Check the `apiRoutes` module for all supported API endpoints.

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes with descriptive messages.
4. Submit a pull request.

---

## License

This project is licensed under the MIT License.

---

## Support

For issues or inquiries, please contact [ifedayo@velvpay.com](mailto:ifedayo@velvpay.com).