import { DiscountApplicationStrategy } from "../generated/api";
import common from "../../common.js";

const EMPTY_DISCOUNT = {
  discountApplicationStrategy: DiscountApplicationStrategy.All,
  discounts: [],
};

export function run(input) {
  const cart = input.cart;
  const discountNode = input.discountNode;

  if (!discountNode?.metafield?.value) {
    return EMPTY_DISCOUNT;
  }

  let rules;
  try {
    rules = JSON.parse(discountNode.metafield.value);
  } catch (e) {
    return EMPTY_DISCOUNT;
  }

  const cartLines = cart.lines || [];
  const discounts = [];
  // Collect all eligible effects first so we can choose the best per item across rules
  const eligibleEffects = {};

  for (const [key, rule] of Object.entries(rules)) {
    const conditions = rule.C ?? [];
    const effect = rule.E ?? [];

    // Handle Free Gift Rule (T = 4)
    if (effect.T === 4) {
      const isEligible = conditions.every((cond) => {
        const compare = (a, b, op) => {
          switch (op) {
            case ">=": return a >= b;
            case ">": return a > b;
            case "==": return a === b;
            case "<=": return a <= b;
            case "<": return a < b;
            default: return false;
          }
        };

        if (cond.T === 1) {
          const variantIdList = cond.VID.map(Number);
          if (cond.VT === 2) {
            const matchQty = cartLines.reduce((total, line) => {
              const variantId = Number(line.merchandise.id.split("/").pop());
              const hasNoProperties = !line.attribute || line.attribute.length === 0;
              const isnotGift = line.attribute === null;
              if (variantIdList.includes(variantId) && hasNoProperties) {
                if(isnotGift){
                   total += line.quantity;
                  }
              }
              return total;
            }, 0);
            return compare(matchQty, cond.V, cond.C);
          } else if (cond.VT === 1) {
            const matchAmount = cartLines.reduce((total, line) => {
              const variantId = Number(line.merchandise.id.split("/").pop());
              const hasNoProperties = !line.attribute || line.attribute.length === 0;
              if (variantIdList.includes(variantId) && hasNoProperties) {
                total += parseFloat(line.cost.subtotalAmount.amount || 0);
              }
              return total;
            }, 0);
            return compare(matchAmount, cond.V, cond.C);
          }
        } else if (cond.T === 5) {
          const totalQty = cartLines.reduce(
            (sum, line) => (line.attribute == null || Object.keys(line.attribute).length === 0) ? sum + line.quantity : sum,
            0
          );
          return compare(totalQty, cond.V, cond.C);
        } else if (cond.T === 4) {
          const totalAmount = cartLines.reduce((total, line) => {
            const hasNoProperties = !line.attribute || line.attribute.length === 0;
            if (hasNoProperties) {
              total += parseFloat(line.cost?.subtotalAmount?.amount || 0);
            }
            return total;
          }, 0);
          return compare(totalAmount, cond.V, cond.C);
        } else if (cond.T == 2) {
          const customerIdRaw = input.cart?.buyerIdentity?.customer?.id || "";
          const customerIdParts = customerIdRaw.split("/");
          const customerId = customerIdParts[customerIdParts.length - 1];

          if (customerId && Array.isArray(cond.CID) && cond.CID.length > 0) {
            return cond.CID.includes(customerId);
          } else {
            return false;
          }
        } else if (cond.T == 7) {
          return true;
        }

        return false;
      });

      if (isEligible) {
        const giftVariantIds = effect.VID.map(Number);
        const giftTargets = [];

        cartLines.forEach((line) => {
          const variantId = Number(line.merchandise.id.split("/").pop());
          const isGift = line.attribute && line.attribute.value === "true";
          const isMatch = giftVariantIds.includes(variantId);

          if (isGift && isMatch) {
            giftTargets.push({
              cartLine: {
                id: line.id,
                quantity: effect.V,
              },
            });
          }
        });

        if (giftTargets.length > 0) {
          discounts.push({
            message: `${effect.rulename || "Free Gift Applied"} - (${key})`,
            targets: giftTargets,
            value: {
              percentage: {
                value: 100.0,
              },
            },
          });
        }
      }
    } else {
      if (rule.C && rule.E) {
        const conditionFlag = common.checkCondition(input, rule.C);
        if (conditionFlag) {
          eligibleEffects[key] = rule.E; // defer generation so we can compare across rules
        }
      }
    }
  }

  // Generate discounts once using all eligible effects; common.effectGenerate
  // will pick the best discount per line (e.g., 70% over 40%).
  if (Object.keys(eligibleEffects).length > 0) {
    const generatedDiscounts = common.effectGenerate(input, eligibleEffects);
    if (Array.isArray(generatedDiscounts)) {
      discounts.push(...generatedDiscounts);
    }
  }

  return {
    discounts,
    discountApplicationStrategy: DiscountApplicationStrategy.All,
  };
}