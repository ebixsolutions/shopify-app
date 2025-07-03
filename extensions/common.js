import config from "./config.js";
export default {

    checkCondition(input, conditions) {
        var conditionFlag = false;
        /* 
            T- type
            VT - value_type
            V - value
            C - condition
            VID - varient_ids
            CID - customer_ids
        */

        conditions.forEach((condition, index) => {
            var condFlag = false;
            var date = new Date(input.shop.localTime.date);
            if (condition.T == 1) {    // specific_product
                var value = 0;
                if (condition.VID && condition.VID.length) {
                    input.cart.lines
                        .map(line => {
                            const variant = (line.merchandise);
                            const cost = line.cost;

                            if (variant.id) {
                                var id_arr = variant.id.split("/")
                                var id = id_arr ? id_arr[id_arr.length - 1] : "";

                                if (condition.VID.findIndex((v) => v == id) > -1) {

                                    if (condition.VT == 1)   // amount
                                        value += cost.subtotalAmount.amount
                                    else if (condition.VT == 2) // count
                                        value += line.quantity
                                }
                            }
                        })

                    if (condition.VT == 1)   // amount
                        condFlag = this.ConditionCheck(value, condition.C, condition.V * input.presentmentCurrencyRate)
                    else if (condition.VT == 2) // count
                        condFlag = this.ConditionCheck(value, condition.C, condition.V)
                }
            } else if (condition.T == 2) {  // specific_users
                var customerId = input.cart.buyerIdentity ? input.cart.buyerIdentity.customer.id : "";
                var id_arr = customerId.split("/")
                var id = id_arr && id_arr[id_arr.length - 1] ? id_arr[id_arr.length - 1] : "";

                if (id && condition.CID && condition.CID.length > 0)
                    condFlag = condition.CID.findIndex((v) => v == id) > -1;
                else
                    condFlag = false
            } else if (condition.T == 3) {  // new_users
                condFlag = input.cart.buyerIdentity && input.cart.buyerIdentity.customer.numberOfOrders == 0
            } else if (condition.T == 4) {  // cart_item_total
                const totalAmount = input.cart.cost.totalAmount.amount
                // const totalAmount = input.cart.lines.reduce((t, v) => t + v.cost.subtotalAmount.amount)
                condFlag = this.ConditionCheck(totalAmount, condition.C, condition.V * input.presentmentCurrencyRate)
            } else if (condition.T == 5) {  // cart_item_count
                var quantity = input.cart.lines.reduce((a, v) => v.quantity + a, 0)
                condFlag = this.ConditionCheck(quantity, condition.C, condition.V)
            } else if (condition.T == 6) {  // condition_flag
                condFlag = condition.V
            } else if (condition.T == 7) {  // no_condition
                condFlag = true;
            } else if (condition.T == 8) {  // specific_date

                condFlag = condition.V.includes(date.toISOString().split('T')[0]);
            } else if (condition.T == 9) {  // specific_day_month

                condFlag = condition.V.includes(date.getDate());
            } else if (condition.T == 10) { // specific_day_week

                condFlag = condition.V.includes(date.getDay());
            } else if (condition.T == 11) { // date_range

                const date1 = new Date(condition.V[0].split(" ")[0]);
                const date2 = new Date(condition.V[1].split(" ")[0]);
                condFlag = date.getTime() >= date1.getTime() && date.getTime() <= date2.getTime();
            }

            if (index == 0)
                conditionFlag = condFlag
            else
                conditionFlag = conditionFlag && condFlag

            if (!conditionFlag)
                return conditionFlag;

        })

        return conditionFlag;
    },

    ConditionCheck(val1, op, val2) {
        switch (op) {
            case "=": return val1 == val2;
            case "!=": return val1 != val2;
            case ">=": return val1 >= val2;
            case "<=": return val1 <= val2;
            case ">": return val1 > val2;
            case "<": return val1 < val2;
            default: return false;
        }
    },

    effectGenerate(input, effects) {

        var discounts = [];
        try {

            for (let i in effects) {
                const effect = effects[i];
                var targets = [];
                /* 
                    T- type
                    VT - value_type
                    V - value
                    Q - count
                    VID - varient_ids
                    EVID - exclude_varient_ids
                    VD - varient_datas
                */

                var message = "";
                if (effect.T == 2 || effect.T == 7) message = "Order Discount"
                else if (effect.T == 3) message = "Shipping Discount"
                else if (effect.T == 8) message = "Loyalty redeem points"
                else message = `${effect.rulename}`;
                message += ` - (${i})`;

                if (effect.T == 1) { // specific_product_discount

                    targets = input.cart.lines
                        .filter(line => {
                            const variant = (line.merchandise);

                            var flag = line.merchandise.__typename == "ProductVariant";

                            if (effect.VID && effect.VID.length && variant.id) {
                                var id_arr = variant.id.split("/")
                                var id = id_arr ? id_arr[id_arr.length - 1] : "";
                                flag = flag && effect.VID.findIndex((v) => v == id) > -1;
                            }

                            if (effect.EVID && effect.EVID.length && variant.id) {
                                var id_arr = variant.id.split("/")
                                var id = id_arr ? id_arr[id_arr.length - 1] : "";
                                flag = flag && !(effect.EVID.findIndex((v) => v == id) > -1);
                            }

                            return flag;
                        })
                        .map(line => {
                            const variant = (line.merchandise);
                            return ({
                                productVariant: {
                                    id: variant.id,
                                    quantity: line.quantity
                                }
                            });
                        });
                } else if (effect.T == 2) {  // total_discount

                    targets = input.cart.lines
                        .filter(line => {
                            const variant = (line.merchandise);

                            var flag = line.merchandise.__typename == "ProductVariant";

                            if (effect.EVID && effect.EVID.length && variant.id) {
                                var id_arr = variant.id.split("/")
                                var id = id_arr ? id_arr[id_arr.length - 1] : "";
                                flag = flag && !(effect.EVID.findIndex((v) => v == id) > -1);
                            }

                            return flag;
                        })
                        .map(line => {
                            const variant = (line.merchandise);
                            return ({
                                productVariant: {
                                    id: variant.id
                                }
                            });
                        });
                } else if (effect.T == 3) {  // shipping_discount

                    var deliveryGroups = input.cart.deliveryGroups.map((deliveryGroup) => {
                        return deliveryGroup.deliveryOptions;
                    });
                    deliveryGroups = deliveryGroups.flat();

                    targets = deliveryGroups
                        .map(deliveryGroup => {
                            return ({
                                deliveryOption: {
                                    handle: deliveryGroup.handle
                                }
                            });
                        });
                } else if (effect.T === 4) {  // Free Gift logic
                    let remainingGifts = parseInt(effect.V);
                    if (remainingGifts > 0) {
                        const cartLines = input.cart?.lines || [];

                        cartLines.forEach((line) => {
                            if (!line || !line.merchandise || !line.merchandise.id) return;

                            const variantId = line.merchandise.id;
                            const isGift = line.attribute?.value === "true";

                            if (isGift && remainingGifts > 0) {
                                const finalQty = Math.min(line.quantity, remainingGifts);
                                remainingGifts -= finalQty;

                                discounts.push({
                                    message: "Free Gift Applied",
                                    targets: {
                                        productVariant: {
                                            id: variantId, // Keeping the same product ID
                                            quantity: finalQty // Adding extra quantity
                                        }
                                    },
                                    value: {
                                        percentage: {
                                            value: 100.0
                                        }
                                    }
                                });
                            }
                        });
                    }
                } else if (effect.T == 5) {  // special_price
                    if (effect.VD && effect.VD.length) {
                        input.cart.lines.forEach(line => {
                            const variant = (line.merchandise);
                            const cost = line.cost;

                            if (line.merchandise.__typename == "ProductVariant") {
                                var id_arr = variant.id.split("/")
                                var id = id_arr ? id_arr[id_arr.length - 1] : "";
                                const index = effect.VD.findIndex((v) => v.id == id);

                                if (index > -1) {
                                    var value = line.quantity * effect.VD[index].V;

                                    discounts.push({
                                        message,
                                        targets: {
                                            productVariant: {
                                                id: variant.id,
                                                quantity: line.quantity
                                            }
                                        },
                                        value: {
                                            fixedAmount: {
                                                amount: cost.subtotalAmount.amount >= value ? (cost.subtotalAmount.amount - (value * input.presentmentCurrencyRate)).toString() : "0"
                                            }
                                        }
                                    })
                                }
                            }
                        })
                    }
                } else if (effect.T == 6) {  // plural_discount

                    targets = input.cart.lines
                        .filter(line => {
                            const variant = (line.merchandise);

                            var flag = line.merchandise.__typename == "ProductVariant";

                            flag = flag && line.quantity >= effect.Q;

                            if (effect.VID && effect.VID.length && variant.id && flag) {
                                var id_arr = variant.id.split("/")
                                var id = id_arr ? id_arr[id_arr.length - 1] : "";
                                flag = flag && effect.VID.findIndex((v) => v == id) > -1;
                            }

                            if (effect.EVID && effect.EVID.length && variant.id && flag) {
                                var id_arr = variant.id.split("/")
                                var id = id_arr ? id_arr[id_arr.length - 1] : "";
                                flag = flag && !(effect.EVID.findIndex((v) => v == id) > -1);
                            }

                            return flag;
                        })
                        .map(line => {
                            const variant = (line.merchandise);
                            return ({
                                productVariant: {
                                    id: variant.id,
                                    quantity: Math.floor(line.quantity / effect.Q),
                                }
                            });
                        });
                } else if (effect.T == 7 || effect.T == 8) {  // total_sales_user | loyalty_redeem

                    targets = input.cart.lines
                        .map(line => {
                            const variant = (line.merchandise);
                            return ({
                                productVariant: {
                                    id: variant.id,
                                    quantity: line.quantity
                                }
                            });
                        });
                }

                if ([1, 2, 3, 6].includes(parseInt(effect.T)) && targets.length > 0) {

                    var discountValue = {};
                    if (effect.VT == 1) //fixed_amount
                        discountValue = {
                            fixedAmount: {
                                amount: (effect.V * input.presentmentCurrencyRate).toString()
                            }
                        }
                    else if (effect.VT == 2) //percentage
                        discountValue = {
                            percentage: {
                                value: effect.V.toString()
                            }
                        }

                    if ([1, 6].includes(parseInt(effect.T)))
                        targets.forEach(target => {
                            discounts.push({
                                message,
                                targets: target,
                                value: discountValue
                            })
                        })
                    else
                        discounts.push({
                            message,
                            targets,
                            value: discountValue
                        })

                } else if ([7, 8].includes(parseInt(effect.T)) && targets.length > 0) {  // total_sales_user | loyalty_redeem
                    var customerId = input.cart.buyerIdentity ? input.cart.buyerIdentity.customer.id : "";
                    var id_arr = customerId.split("/")
                    var id = id_arr && id_arr[id_arr.length - 1] ? id_arr[id_arr.length - 1] : "";

                    if (id && effect.V[id])
                        discounts.push({
                            message,
                            targets,
                            value: {
                                fixedAmount: {
                                    amount: (effect.V[id] * input.presentmentCurrencyRate).toString()
                                }
                            }
                        })

                }

                if ([1, 4, 5, 6].includes(parseInt(effect.T))) {

                    var prices = {};
                    input.cart.lines.forEach(line => {
                        const variant = (line.merchandise);
                        prices[variant.id] = line.cost.subtotalAmount.amount / line.quantity;
                    });

                    var tempDiscounts = [];
                    discounts.forEach(discount => {
                        const target = discount.targets;
                        const discountVal = discount.value;
                        var discountAmt = 0;

                        if (discountVal.percentage && target.productVariant.id && prices[target.productVariant.id])
                            discountAmt = (prices[target.productVariant.id] * discountVal.percentage.value) / 100;
                        else if (discountVal.fixedAmount)
                            discountAmt = discountVal.fixedAmount.amount;

                        const oldDiscountIndex = tempDiscounts.findIndex(v => v.targets.productVariant.id == target.productVariant.id)

                        if (oldDiscountIndex > -1) {
                            var oldDiscount = tempDiscounts[oldDiscountIndex];
                            const oldTarget = oldDiscount.targets;

                            if (parseInt(oldTarget.productVariant.quantity) == parseInt(target.productVariant.quantity)) {

                                const oldDiscountVal = oldDiscount.value;
                                var oldDiscountAmt = 0;

                                if (oldDiscountVal.percentage && oldTarget.productVariant.id && prices[oldTarget.productVariant.id])
                                    oldDiscountAmt = (prices[oldTarget.productVariant.id] * oldDiscountVal.percentage.value) / 100;
                                else if (oldDiscountVal.fixedAmount)
                                    oldDiscountAmt = oldDiscountVal.fixedAmount.amount;

                                if (parseFloat(oldDiscountAmt) < parseFloat(discountAmt))
                                    tempDiscounts[oldDiscountIndex] = discount
                            } else
                                tempDiscounts.push(discount)
                        } else
                            tempDiscounts.push(discount)
                    })
                    discounts = tempDiscounts
                }
            }

            if (!discounts.length) {
                console.error("No cart lines qualify for volume discount.");
                return [];
            }
            else
                return discounts;
        } catch (err) {
            console.error(err.message);
            return [];
        }
    }
}