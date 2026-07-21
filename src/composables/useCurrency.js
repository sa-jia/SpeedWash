import Decimal from "decimal.js";

Decimal.set({ precision: 20, rounding: 4 });

export function useCurrency() {
  const sgdToCents = (sgd) => {
    if (!sgd) {
      return 0;
    }
    return new Decimal(sgd).mul(100).toDecimalPlaces(0).toNumber();
  };

  const centsToSGD = (cents) => {
    if (!cents) {
      return "0.00";
    }
    return new Decimal(cents).div(100).toDecimalPlaces(2).toString();
  };

  const formatSGD = (amount) => {
    return `$ ${new Decimal(amount).toDecimalPlaces(2).toString()}`;
  };

  const add = (sgd1, sgd2) => {
    return new Decimal(sgd1).add(sgd2).toDecimalPlaces(2).toString();
  };

  const sub = (sgd1, sgd2) => {
    return new Decimal(sgd1).sub(sgd2).toDecimalPlaces(2).toString();
  };

  return {
    sgdToCents,
    centsToSGD,
    formatSGD,
    add,
    sub,
  };
}
