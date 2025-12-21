import BigNumber from 'bignumber.js';

export const convertDistance = (
  unit: string,
  value: string | number,
): number => {
  if (unit === 'meter') return +value;

  switch (unit) {
    case 'centimeter':
      return new BigNumber(value.toString()).dividedBy(100).toNumber();
    case 'inch':
      return new BigNumber(value.toString()).multipliedBy(0.0254).toNumber();
    case 'feet':
      return new BigNumber(value.toString()).multipliedBy(0.3048).toNumber();
    case 'yard':
      return new BigNumber(value.toString()).multipliedBy(0.9144).toNumber();
    default:
      throw new Error('Invalid unit');
  }
};

export const convertTempature = (
  unit: string,
  value: string | number,
): number => {
  if (unit === 'celsius') return +value;

  switch (unit) {
    case 'fahrenheit':
      return new BigNumber(value.toString())
        .multipliedBy(9 / 5)
        .plus(32)
        .toNumber();
    case 'kelvin':
      return new BigNumber(value.toString()).plus(273.15).toNumber();
    default:
      throw new Error('Invalid unit');
  }
};
