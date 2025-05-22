/**
 * Моковые данные для WebPay платежей в режиме разработки
 */
export const mockWebPayResponse = {
    page: "success",
    invoice_no: "825986414",
    invoice_transaction: 789293582,
    invoice_auth: "324165",
    invoice_date: "2025.03.07 23:16:03",
    form_card_pan: "434179xxxxxx0051",
    invoice_rrn: "324165273219",
    order_num: "627270129409139",
    order_note: "",
    customerName: "",
    customerAddress: "",
    serviceDate: "",
    for_merchant: "Лучший магазин",
    storeSite: "webpay.by",
    currentTheme: "default",
    pdf_url: "https://sandbox.webpay.by/?G2teXoRvPiG6ICDhAQtvZTo6HCFAg1H5lxMutd74H7RdZ4c5dN8%2BJRPo%2BBpZLIpdbsbLESaeVsqM39CogGATYtpD%2BdQCWP%2B2n1HPXhxFGsoKIw%3D%3D",
    items: [
        {
            name: "Носочки",
            quantity: "1",
            price: "10.00",
            totalAmount: "10.00",
            commission: "0.00"
        }
    ],
    amount: "10.00",
    currency: "BYN",
    commission: "0.00",
    orderNumber: "627270129409139",
    warning: false,
    token: "2608e0060a1471875c8850843c4f3cb6=54334654656d63335557686a63315530615849344c304a52516a64464d6b316c5a307474644752355247747764573176567a5a305a6e5a31627a302c",
    tokenName: "wt",
    redirectUrl: "http://localhost:3000/payment/success?order=627270129409139",
    wt: "2608e0060a1471875c8850843c4f3cb6=54334654656d63335557686a63315530615849344c304a52516a64464d6b316c5a307474644752355247747764573176567a5a305a6e5a31627a302c"
}; 