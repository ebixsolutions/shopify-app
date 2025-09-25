window.onload = () => {

    function ebix_getCookie(cname) {
        let name = cname + "=";
        let decodedCookie = decodeURIComponent(document.cookie);
        let ca = decodedCookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }

    function validateEmail(email) {
        var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        return re.test(email);
    }

    function ebix_register_referral() {
        $("#ebix-custom-prompt").show();
        $("#ebix-referral-code-input").val("");

        $("#ebix-confirm-referral").off().on("click", function () {
            const code = $("#ebix-referral-code-input").val();
            $("#ebix-custom-prompt").hide();

            if (code) {
                let oldBtnTxt = $("#ebix-join-referral").text();
                $("#ebix-join-referral").text("Loading...");
                $("#ebix-join-referral").prop("disabled", true);
                fetch(`/apps/shopify/register_referral`, {
                    method: "POST",
                    body: JSON.stringify({
                        customer_id: ebix_Promotion.CustomerId,
                        shopify_shop_id: ebix_Promotion.ShopId,
                        code
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true',
                        'Sys-Language': 'en'
                    }
                })
                    .then((response) => response.json())
                    .then((res) => {

                        $("#ebix-join-referral").text(oldBtnTxt);
                        $("#ebix-join-referral").prop("disabled", false);
                        $("#ebix-ref-err").html("");

                        if (res.code == 0) {
                            $("#ebix-referral-card").hide();
                            $("#ebix-join-referral").hide();
                            $("#ebix-redeem-point").hide();
                            ebix_getDatas();
                        } else {
                            $("#ebix-ref-err").html(`<p style="color:red">${res.msg}</p>`);
                        }
                    }).catch(e => {
                        $("#ebix-join-referral").text(oldBtnTxt);
                        $("#ebix-join-referral").prop("disabled", false);
                    });
            }
        });
        // Cancel click
        $("#ebix-cancel-referral").off().on("click", function () {
            $("#ebix-custom-prompt").hide();
        });
    }

    function ebix_generate_table(data, className, flag = false) {

        if (data && data.length > 0) {
            $(`.${className}`).each(function () {
                const elementId = $(this).attr("id");

                let content = "<table class='table'>";

                // choose heading depending on container id
                let table_heading = "<tr><th></th><th>Referee (New member) Tasks</th><th>Awards</th>";
                if (elementId === "reward_only") {
                    table_heading = "<tr><th></th><th>Tasks</th><th>Awards</th>";
                }

                content += table_heading;
                content += flag ? "<th>Get</th></tr>" : "</tr>";

                data.forEach((item) => {
                    item.rules.forEach((val, i) => {
                        content += "<tr>";

                        let img_src = ebix_referral_img3;
                        if (val.attribute_operation === "Register")
                            img_src = ebix_referral_img1;
                        else if (val.attribute_operation === "visit_page")
                            img_src = ebix_referral_img2;

                        content += `<td><img src="${img_src}" width="26" alt="${val.attribute_operation}"/></td>`;
                        content += `<td>${val.task}</td>`;

                        if (i === 0) {
                            content += `<td rowspan="${item.rules.length}">${item.award}</td>`;
                            if (flag) {
                                if (val.is_rule_passed)
                                    content += `<td rowspan="${item.rules.length}" style="font-size: 2rem;color: green;">✓</td>`;
                                else if (val.expiry_status)
                                    content += `<td rowspan="${item.rules.length}" style="color: red;">${val.expiry_date} Expired</td>`;
                                else
                                    content += `<td rowspan="${item.rules.length}">${val.expiry_date}</td>`;
                            }
                        }

                        content += "</tr>";
                    });
                });

                content += "</table>";

                // inject into THIS element only
                $(this).html(content);
            });
        }

        const ids = $(".ebix-modal #specific-link");
        ids.append("<svg fill='currentColor' style='margin-left: 3px' width='15' height='15' viewBox='0 0 15 15' xmlns='http://www.w3.org/2000/svg'><path d='M3 2C2.44772 2 2 2.44772 2 3V12C2 12.5523 2.44772 13 3 13H12C12.5523 13 13 12.5523 13 12V8.5C13 8.22386 12.7761 8 12.5 8C12.2239 8 12 8.22386 12 8.5V12H3V3L6.5 3C6.77614 3 7 2.77614 7 2.5C7 2.22386 6.77614 2 6.5 2H3ZM12.8536 2.14645C12.9015 2.19439 12.9377 2.24964 12.9621 2.30861C12.9861 2.36669 12.9996 2.4303 13 2.497L13 2.5V2.50049V5.5C13 5.77614 12.7761 6 12.5 6C12.2239 6 12 5.77614 12 5.5V3.70711L6.85355 8.85355C6.65829 9.04882 6.34171 9.04882 6.14645 8.85355C5.95118 8.65829 5.95118 8.34171 6.14645 8.14645L11.2929 3H9.5C9.22386 3 9 2.77614 9 2.5C9 2.22386 9.22386 2 9.5 2H12.4999H12.5C12.5678 2 12.6324 2.01349 12.6914 2.03794C12.7504 2.06234 12.8056 2.09851 12.8536 2.14645Z' fill='currentColor' fill-rule='evenodd' clip-rule='evenodd'></path></svg>")

        // click specific link
        ids.click(function () {

            let ref_row_id = $(this).attr('ref-id');
            let ref_rule_id = $(this).attr('ref-rule-id');
            let href = $(this).attr('href');
            let oldTxt = $(this).html();

            $(this).html("Loading...");

            if (ref_rule_id && ref_row_id) {
                const req = JSON.stringify({
                    customer_id: ebix_Promotion.CustomerId,
                    shopify_shop_id: ebix_Promotion.ShopId,
                    ref_row_id: ref_row_id,
                    ref_rule_id: ref_rule_id
                });

                fetch(`/apps/shopify/referral_visit`, {
                    method: "POST",
                    body: req,
                    headers: {
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true',
                        'Sys-Language': 'en'
                    }
                })
                    .then((response) => response.json())
                    .then((res) => {
                        $(this).html(oldTxt);
                        window.location.href = href;
                    })
                    .catch(e => {
                        $(this).html(oldTxt);
                        window.location.href = href;
                    })
            }
        });
    }

    function ebix_referral_table(data, id) {
        if (data && data.length > 0) {
            var content = "<p><b>From Referrals</b><p>You can get rewards when your recommended friends complete tasks</p></p>";
            content += "<table class='table'>";
            content += "<tr><th>Referral No</th><th>Recipient email</th><th>Date</th><th>Status</th><th>Rewards</th></tr>";

            data.forEach((item, index) => {
                if (item.referral_no && item.email && item.date && item.status && item.reward) {
                    content += "<tr>";
                    content += `<td>${item.referral_no}</td>`;
                    content += `<td>${item.email}</td>`;
                    content += `<td>${item.date}</td>`;
                    content += `<td>${item.status}</td>`;
                    content += `<td>${item.reward}</td>`;
                    content += "</tr>";
                } else {
                    // console.log(`No referral history for item ${index}`);
                }
            });

            content += "</table>";

            $(`.ebix-modal #${id}`).html(content);
        }
    }

    function getCurrentProductHandle() {
        const path = window.location.pathname;
        const match = path.match(/^\/products\/([\w-]+)/);
        return match ? match[1] : null;
    }

    const originalDispatchEvent = EventTarget.prototype.dispatchEvent;

    EventTarget.prototype.dispatchEvent = function (event) {
        const result = originalDispatchEvent.call(this, event);
        const inputs = document.querySelectorAll('form[action^="/cart/add"] input[name="id"]');
        const lastInput = inputs[inputs.length - 1];
        if (lastInput) {
            displayAllProductIds(lastInput.value);
        }
        return result;
    };

    function displayAllProductIds(value) {
        const products = getCurrentProductHandle();
        const onpageVID = document.querySelector('form[action^="/cart/add"] input[name="id"]');
        const variantId = onpageVID ? onpageVID.value : null;
        const variant_id = variantId || value;
        if (!ebix_Promotion.ShopId) return;
        const req = JSON.stringify({
            customer_id: ebix_Promotion.CustomerId,
            shopify_shop_id: ebix_Promotion.ShopId,
            variant_id: variant_id,
        });
        fetch(`/apps/shopify/get_special_price`, {
            method: "POST",
            body: req,
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                'Sys-Language': 'en'
            }
        })
            .then((response) => response.json())
            .then((res) => {
                const rules = res?.data?.data;

                if (Array.isArray(rules) && rules.length > 0) {
                    rules.forEach(rule => {
                        const newPrice = rule?.eff?.variants?.[0]?.discount_price;
                        const unitPrice = parseFloat(rule?.eff?.variants?.[0]?.unit_price || 0).toFixed(2);

                        $("#spl-price").text(newPrice);
                        $("#unit-price").text(unitPrice);
                    });

                    $("#custom-offer-widget").css("display", "block");
                } else {
                    $("#custom-offer-widget").css("display", "none");
                }
            })
            .catch((error) => {
                console.error("Error fetching special price:", error);
                $("#custom-offer-widget").css("display", "none");
            });
    }
    displayAllProductIds();
    function PromotionList(value) {
        const promotion = window.ebix_Promotion;

        if (!promotion?.ShopId) {
            console.warn("ShopId not found in ebix_Promotion");
            return;
        }

        const onpageVID = document.querySelector('form[action^="/cart/add"] input[name="id"]');
        const variantId = onpageVID ? onpageVID.value : null;
        const variant_id = variantId || value;

        const req = JSON.stringify({
            customer_id: promotion.CustomerId,
            shopify_shop_id: promotion.ShopId,
            variant_id: variant_id,
        });

        fetch(`/apps/shopify/promotion_list`, {
            method: "POST",
            body: req,
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                'Sys-Language': 'en'
            }
        })
            .then((response) => response.json())
            .then((res) => {
                const container = document.getElementById("Promotion-List");
                const block = container.querySelector(".Promotion-List-block");
                const offerBox = container.querySelector(".Promotion-List-offer-box");
                block.innerHTML = "";

                if (res.status === 200 && res.code === 0 && Array.isArray(res.data)) {
                    res.data.forEach(offer => {
                       if (
                            offer.offer_message &&
                            offer.offer_message.trim() !== "" &&
                            offer.offer_type &&
                            offer.offer_type.trim() !== ""
                        ) {
                            const clone = offerBox.cloneNode(true);

                            const offerText = clone.querySelector(".Promotion-List-offer-text");
                            const offerLabelText = clone.querySelector(".Promotion-List-offer-label");

                            if (offerText) offerText.textContent = offer.offer_message;
                            else console.error("Missing .Promotion-List-offer-text in clone");

                            if (offerLabelText) offerLabelText.textContent = offer.offer_type;
                            else console.error("Missing .Promotion-List-offer-label in clone");

                            block.appendChild(clone);
                        }
                    });

                    if (block.children.length > 0) {
                        container.style.display = "block";
                    }
                }
            })
            .catch((error) => {
                console.error("Error fetching special price:", error);
                document.getElementById("Promotion-List").style.display = "none";
            });
    }
    function ebix_getDatas() {
        if (ebix_Promotion.ShopId) {
            fetch(`/apps/shopify/loyalty`, {
                method: "POST",
                body: JSON.stringify({
                    customer_id: ebix_Promotion.CustomerId,
                    shopify_shop_id: ebix_Promotion.ShopId
                }),
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true',
                    'Sys-Language': 'en'
                }
            })
                .then((response) => response.json())
                .then((res) => {

                    if (res.data) {

                        const data = res.data;
                        if (data.membership) {
                            $("#ebix-tier").text(data.membership.name || "-");
                        }

                        $("#ebix-points").text(data.active_pts || 0);

                        if (data.reward) {
                            $("#ebix-loyalty-card").css("display", "block")
                            $("#ebix-reward").html(`${data.currency} ${data.reward.amount} = ${data.reward.points} Point`);
                        }

                        if (data.redeem) {
                            $("#ebix-loyalty-card").css("display", "block")
                            $("#ebix-redeem").html(`${data.redeem.points} Point = ${data.currency} ${data.redeem.amount}`);
                        }

                        if (data.redeem && data.redeem.max_pts) {
                            if (data.redeem) {
                                $("#ebix-max-point").text(data.redeem.max_pts || 0)
                                $("#ebix-redeem-coupon").text(data.redeem_code || "");
                            }

                            $("#ebix-redeem-point").show();
                            $("#total-redeemable").text(`(${data.currency} ${((data.redeem.amount / data.redeem.points) * data.redeem?.max_pts)})`);
                        }

                        $("#ebix-pro-ref-code").text(data.invite_code || "");

                        $("#refer-friend #facebook").attr("href", encodeURI(`https://www.facebook.com/sharer/sharer.php?u=${window.shopUrl}&t=Register and use this code: ${data.invite_code}`));
    

                        $("#refer-friend #email").click((e) => {

                            var emails = prompt("Enter invitation emails:");
                            emails = emails.split(",").map(v => v.trim())

                            $("#ebix-email-err").text("");

                            var emailErr = 0
                            emails.forEach(email => {
                                if (!validateEmail(email)) {
                                    $("#ebix-email-err").append(`<p style="color:red">${email}: Invalid email.</p>`);
                                    emailErr++;
                                }
                            })

                            if (emailErr == 0) {
                                fetch(`/apps/shopify/email_invite`, {
                                    method: "POST",
                                    body: JSON.stringify({
                                        customer_id: ebix_Promotion.CustomerId,
                                        shopify_shop_id: ebix_Promotion.ShopId,
                                        emails: emails
                                    }),
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'ngrok-skip-browser-warning': 'true',
                                        'Sys-Language': 'en'
                                    }
                                })
                                    .then((response) => response.json())
                                    .then((res) => {
                                        if (res.data) {
                                            if (res.data.already_invited_emails && res.data.already_invited_emails.length > 0) {
                                                $("#ebix-email-err").append(`<p style="color:red">${res.data.already_invited_emails.join(',')} ${res.msg}</p>`);
                                            } else {
                                                $("#ebix-email-err").append(`<p style="color:green">${res.msg}</p>`);
                                            }
                                        }

                                        setTimeout(() => {
                                            $("#ebix-email-err").text("");
                                        }, 10000);
                                    })
                            }

                        });

                        const { referral_rule, referral_history, referral_illigible } = data;
                        if (referral_rule.length > 0) {
                            ebix_generate_table(referral_rule, "ebix-ref-reward", ebix_Promotion.CustomerId && !referral_illigible);
                            const awardText = referral_rule[0]?.award || "";
                            $("#refer-friend #whatsapp").attr("href", encodeURI(
                                `https://api.whatsapp.com/send?text=${window.shopUrl} \nSignup with code: ${data.invite_code} \nto ${awardText}`
                            ));
                        }
                        if (referral_rule.length > 0 || referral_history.length > 0 || data.reward != null) {
                            $("#ebix-embeded-btn").css("display", "flex");
                        }
                        if (ebix_Promotion.CustomerId) {
                            if (referral_rule.length > 0 || referral_history.length > 0) {
                                $("#ebix-referral-card").css("display", "block");
                                $("#ebix-referral-card").show();
                            }
                        }

                        if (referral_illigible) {
                            $("#ebix-join-referral").show();
                            $("#ebix-join-referral").click((e) => {
                                ebix_register_referral();
                            });
                        }

                        if (referral_rule.length > 0)
                            ebix_generate_table(referral_rule, "ebix-ref-reward", ebix_Promotion.CustomerId && !referral_illigible)
                        if (referral_history.length > 0)
                            ebix_referral_table(referral_history, "ebix-ref-history", ebix_Promotion.CustomerId && !referral_illigible)

                    }
                }).catch(e => {
                    // console.error(e)
                })
        }
    }

    $("#ebix-referral-card").hide();
    $("#ebix-join-referral").hide();
    $("#ebix-redeem-point").hide();

    if (ebix_getCookie("ebix-embeded-closed")) {
        $("#ebix-embeded-btn").css("display", "none")
    } else if (typeof ebix_Promotion !== 'undefined' && ebix_Promotion.ShopId) {
        ebix_getDatas();
    }

    // embed button action
    $(".ebix-embeded-close-btn").click((e) => {
        e.stopPropagation();
        $("#ebix-embeded-btn").css("display", "none")
    });
    $("#ebix-embeded-btn").click((e) => {
        $(".ebix-modal").toggleClass("show")
    });

    // modal action
    $(".ebix-modal-close").click((e) => {
        $(".ebix-modal").toggleClass("show")
    });
    $(".ebix-modal-content").click((e) => {
        e.stopPropagation();
    });
    $(".ebix-modal").click((e) => {
        $(".ebix-modal").toggleClass("show")
    });

    function ebix_copyCode(ele) {
        var copyText = $(ele).text();
        navigator.clipboard.writeText(copyText);
    }

    var cpyRef = null;
    $("#ebix-cpy-ref-code").click((e) => {
        ebix_copyCode("#ebix-pro-ref-code");

        if (cpyRef) clearTimeout(cpyRef)
        $("#ebix-cpy-ref-code").text("Copied!")
        cpyRef = setTimeout(() => $("#ebix-cpy-ref-code").text("Copy"), 5000);
    });

    var cpyRedm = null;
    $("#ebix-cpy-redeem-code").click((e) => {
        ebix_copyCode("#ebix-redeem-coupon");

        if (cpyRedm) clearTimeout(cpyRedm)
        cpyRedm = $("#ebix-cpy-redeem-code").text("Copied!")
        setTimeout(() => $("#ebix-cpy-redeem-code").text("Copy"), 5000);
    });

    (function () {
        const originalFetch = window.fetch;
        window.fetch = async function (input, init) {
            const url = typeof input === 'string' ? input : input?.url || '';
            const response = await originalFetch(input, init);
            if (url.includes('/cart/change') || url.includes('/cart/update') || url.includes('/cart/add')) {
                response.clone().json().then(() => nonAppliedOffer());
            }
            return response;
        };
    })();

    document.addEventListener("DOMContentLoaded", initOfferDisplay);

    window.addEventListener("pageshow", () => nonAppliedOffer());

    const checkoutKeywords = ["check out", "proceed"];
    let insertedOffers = new Set();
    let latestOffers = [];

    function isCheckoutButton(el) {
        const text = (el.innerText || "").toLowerCase();
        return checkoutKeywords.some(keyword => text.includes(keyword));
    }

    function createOfferElement(offer) {
        const template = document.querySelector('#drawer-offers-template .drawer-offers-block');
        if (!template) {
            console.warn("Offer template missing");
            return null;
        }

        const clone = template.cloneNode(true);
        clone.setAttribute("data-injected", "true");
        clone.setAttribute("data-offer-id", offer.rule.promotion_id || offer.rule.rule_id);

        const textEl = clone.querySelector('.offer-text');
        const labelEl = clone.querySelector('.offer-label');

        if (textEl) textEl.textContent = offer.offer_message;
        if (labelEl) labelEl.textContent = offer.offer_type_name || "OFFER";

        return clone;
    }

    function insertOffersBeforeCheckoutButtons(offers) {
        const buttons = document.querySelectorAll("button, a");
        document.querySelectorAll('.drawer-offers-block[data-injected="true"]').forEach(el => el.remove());

        buttons.forEach(el => {
            if (isCheckoutButton(el) && el.offsetParent !== null) {
                const parent = el.parentNode;
                offers.forEach(offer => {
                    const id = offer.rule.promotion_id || offer.rule.rule_id;
                    if (!insertedOffers.has(id)) {
                        const offerElement = createOfferElement(offer);
                        if (offerElement) {
                            parent.insertBefore(offerElement, el);
                            insertedOffers.add(id);
                        }
                    }
                });
            }
        });

        const drawerList = document.getElementById("drawer-offers-list");
        if (drawerList) drawerList.style.display = "none";
    }

    function displayOffersInDrawer(offers) {
        const container = document.getElementById('drawer-offers-list');
        const template = document.querySelector('#drawer-offers-template .drawer-offers-block');
        if (!container || !template) {
            console.warn("Drawer elements missing");
            return;
        }

        container.innerHTML = '';
        offers.forEach(offer => {
            const el = createOfferElement(offer);
            if (el) container.appendChild(el);
        });

        container.style.display = 'block';
    }

    function nonAppliedOffer(retryCount = 0) {
        const promotion = window.ebix_Promotion;
        const currency = (window.Shopify?.currency?.active) || null;
        fetch(window.Shopify.routes.root + 'cart.js')
            .then(res => res.json())
            .then(cart => {
                const payload = {
                    user_id: promotion.CustomerId || null,
                    shop_id: promotion.ShopId || null,
                    terminal: 'web',
                    country_id: ['1'],
                    currency: currency,
                    coupon_code: '',
                    items: cart.items
                };
                insertedOffers.clear();

                return fetch('/apps/shopify/non_applied_offer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            })
            .then(res => res.json())
            .then(response => {
                if (response.status === 200 && Array.isArray(response.data) && response.code === 0) {
                    latestOffers = response.data;
                    displayOffersInDrawer(latestOffers);
                    setTimeout(() => insertOffersBeforeCheckoutButtons(latestOffers), 300);
                } else {
                    console.warn("No offers returned or response invalid");
                }
            })
            .catch(error => {
                console.error("Error fetching offers:", error);
                if (retryCount < 3) {
                    setTimeout(() => nonAppliedOffer(retryCount + 1), 1000);
                }
            });
    }

    function observeDomForButtonInjection() {
        const observer = new MutationObserver(() => {
            if (latestOffers.length > 0) {
                setTimeout(() => insertOffersBeforeCheckoutButtons(latestOffers), 100);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function initOfferDisplay() {
        nonAppliedOffer();
        observeDomForButtonInjection();
    }

    PromotionList();
};