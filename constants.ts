
export const LOYALTY_CONFIG = {
  POINTS_PER_RIYAL: 1, // كل 1 ريال = 1 نقطة
  POINTS_TO_REDEEM_1_SAR: 5, // كل 5 نقاط = 1 ريال خصم
};

export const COLORS = {
  charcoal: 'bg-zinc-950',
  ember: 'text-orange-500',
  emberBg: 'bg-orange-600',
  emberBorder: 'border-orange-500/30'
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount);
};
