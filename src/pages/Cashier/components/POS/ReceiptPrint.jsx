const formatRupiah = (value) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(Number(value || 0));

export const printReceipt = ({
    orderId,
    cart,
    subtotal,
    tax,
    total,
    paymentMethod,
    cashReceived,
    change,
}) => {
    const itemsHtml = cart
        .map(
            (item) => `
                <div class="item">
                    <div>
                        <strong>${item.name}</strong>
                        <br />
                        <span>${item.quantity} x ${formatRupiah(item.price)}</span>
                    </div>
                    <strong>${formatRupiah(item.price * item.quantity)}</strong>
                </div>
            `
        )
        .join("");

    const html = `
        <html>
            <head>
                <title>Receipt</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        width: 320px;
                        margin: 0 auto;
                        padding: 16px;
                        color: #111;
                    }

                    .center {
                        text-align: center;
                    }

                    .line {
                        border-top: 1px dashed #111;
                        margin: 10px 0;
                    }

                    .row,
                    .item {
                        display: flex;
                        justify-content: space-between;
                        gap: 10px;
                        font-size: 13px;
                        margin: 6px 0;
                    }

                    .item span {
                        font-size: 12px;
                    }

                    h2, p {
                        margin: 4px 0;
                    }
                </style>
            </head>

            <body>
                <div class="center">
                    <h2>Double You Cake</h2>
                    <p>Bakery & Cake Shop</p>
                </div>

                <div class="line"></div>

                <div class="row">
                    <span>Order</span>
                    <strong>${orderId}</strong>
                </div>

                <div class="row">
                    <span>Date</span>
                    <strong>${new Date().toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
    })}</strong>
                </div>

                <div class="line"></div>

                ${itemsHtml}

                <div class="line"></div>

                <div class="row">
                    <span>Subtotal</span>
                    <strong>${formatRupiah(subtotal)}</strong>
                </div>

                <div class="row">
                    <span>Tax</span>
                    <strong>${formatRupiah(tax)}</strong>
                </div>

                <div class="row">
                    <span>Total</span>
                    <strong>${formatRupiah(total)}</strong>
                </div>

                <div class="row">
                    <span>Payment</span>
                    <strong>${paymentMethod.toUpperCase()}</strong>
                </div>

                ${paymentMethod === "cash"
            ? `
                            <div class="row">
                                <span>Cash</span>
                                <strong>${formatRupiah(cashReceived)}</strong>
                            </div>

                            <div class="row">
                                <span>Change</span>
                                <strong>${formatRupiah(change)}</strong>
                            </div>
                        `
            : ""
        }

                <div class="line"></div>

                <div class="center">
                    <p>Thank You</p>
                </div>

                <script>
                    window.print();
                    setTimeout(() => window.close(), 500);
                </script>
            </body>
        </html>
    `;

    const win = window.open("", "_blank", "width=420,height=700");
    win.document.write(html);
    win.document.close();
};