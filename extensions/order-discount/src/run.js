import { DiscountApplicationStrategy } from "../generated/api";
import common from "../../common.js";


const EMPTY_DISCOUNT = {
  discountApplicationStrategy: DiscountApplicationStrategy.Maximum,
  discounts: [],
};

export function run(input) {
  const configuration = JSON.parse(
    input?.discountNode?.metafield?.value ?? "{}"
  );
  if (!configuration || Object.keys(configuration).length == 0)
    return EMPTY_DISCOUNT;

  var discounts = [];
  var effects = [];

  // condition check
  for (let i in configuration) {
    const item = configuration[i];
    if (item.C && item.E) {
      const condition = item.C ?? [];
      const effect = item.E ?? [];
      const conditionFlag = common.checkCondition(input, condition);
      if (conditionFlag) effects[i] = effect
    }
  }

  // effect
  if (effects && effects.length) {
    discounts = common.effectGenerate(input, effects)
  } else {
    console.error("Condition not satisfy.");
    return EMPTY_DISCOUNT;
  }

  return {
    discounts,
    discountApplicationStrategy: DiscountApplicationStrategy.Maximum
  };
};