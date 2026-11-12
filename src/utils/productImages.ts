import { Product } from '../types/index.ts';

export const PRODUCT_IMAGE_MAP: Record<string, string> = {
  'prod-1': '/src/assets/images/prod_atta_5kg_1794242903635.jpg',
  'prod-2': '/src/assets/images/prod_cow_ghee_1l_1794242903605.jpg',
  'prod-3': '/src/assets/images/prod_sunflower_oil_1l_1794242904769.jpg',
  'prod-4': '/src/assets/images/prod_iodized_salt_1kg_1794242905742.jpg',
  'prod-5': '/src/assets/images/prod_basmati_rice_5kg_1794242906664.jpg',
  'prod-6': '/src/assets/images/prod_dairy_milk_silk_1794242907123.jpg',
  'prod-7': '/src/assets/images/prod_toned_milk_1l_1794242908267.jpg',
  'prod-8': '/src/assets/images/prod_liquid_detergent_1l_1794242908405.jpg',
  'prod-9': '/src/assets/images/prod_liquid_handwash_750ml_1794242909253.jpg',
  'prod-10': '/src/assets/images/prod_masala_noodles_pack_1794242910580.jpg',
  'prod-11': '/src/assets/images/prod_instant_coffee_jar_1794242910827.jpg',
  'prod-12': '/src/assets/images/prod_glucose_biscuits_1kg_1794242912396.jpg',
  'prod-13': '/src/assets/images/prod_toothpaste_150g_1794242912899.jpg',
  'prod-14': '/src/assets/images/prod_masala_chips_90g_1794242913995.jpg',
  'prod-15': '/src/assets/images/prod_energy_drink_250ml_1794242915380.jpg'
};

export const SKU_IMAGE_MAP: Record<string, string> = {
  'ATT-ASH-5KG': '/src/assets/images/prod_atta_5kg_1794242903635.jpg',
  'GHE-AML-1L': '/src/assets/images/prod_cow_ghee_1l_1794242903605.jpg',
  'OIL-FTN-1L': '/src/assets/images/prod_sunflower_oil_1l_1794242904769.jpg',
  'SLT-TAT-1KG': '/src/assets/images/prod_iodized_salt_1kg_1794242905742.jpg',
  'RIC-ING-5KG': '/src/assets/images/prod_basmati_rice_5kg_1794242906664.jpg',
  'CHC-CDB-150G': '/src/assets/images/prod_dairy_milk_silk_1794242907123.jpg',
  'MLK-AML-1L': '/src/assets/images/prod_toned_milk_1l_1794242908267.jpg',
  'DET-SRF-1L': '/src/assets/images/prod_liquid_detergent_1l_1794242908405.jpg',
  'HW-DTL-750M': '/src/assets/images/prod_liquid_handwash_750ml_1794242909253.jpg',
  'NDL-MGI-420G': '/src/assets/images/prod_masala_noodles_pack_1794242910580.jpg',
  'BEV-NSC-100G': '/src/assets/images/prod_instant_coffee_jar_1794242910827.jpg',
  'BSC-PRL-1KG': '/src/assets/images/prod_glucose_biscuits_1kg_1794242912396.jpg',
  'OC-CLG-150G': '/src/assets/images/prod_toothpaste_150g_1794242912899.jpg',
  'SNK-LAY-90G': '/src/assets/images/prod_masala_chips_90g_1794242913995.jpg',
  'BEV-RDB-250M': '/src/assets/images/prod_energy_drink_250ml_1794242915380.jpg'
};

export function getProductImage(
  product?: Partial<Product> | { id?: string; productId?: string; sku?: string; name?: string; category?: string; imageUrl?: string } | null
): string {
  if (!product) return '/src/assets/images/prod_atta_5kg_1794242903635.jpg';

  if ('imageUrl' in product && product.imageUrl && product.imageUrl.trim()) {
    return product.imageUrl;
  }

  const id = ('id' in product && product.id) ? product.id : ('productId' in product && product.productId ? product.productId : '');
  if (id && PRODUCT_IMAGE_MAP[id]) {
    return PRODUCT_IMAGE_MAP[id];
  }

  if (product.sku && SKU_IMAGE_MAP[product.sku]) {
    return SKU_IMAGE_MAP[product.sku];
  }

  const nameLower = (product.name || '').toLowerCase();
  if (nameLower.includes('atta') || nameLower.includes('flour')) return PRODUCT_IMAGE_MAP['prod-1'];
  if (nameLower.includes('ghee')) return PRODUCT_IMAGE_MAP['prod-2'];
  if (nameLower.includes('oil') || nameLower.includes('sunlite') || nameLower.includes('fortune')) return PRODUCT_IMAGE_MAP['prod-3'];
  if (nameLower.includes('salt')) return PRODUCT_IMAGE_MAP['prod-4'];
  if (nameLower.includes('rice') || nameLower.includes('basmati')) return PRODUCT_IMAGE_MAP['prod-5'];
  if (nameLower.includes('chocolate') || nameLower.includes('dairy milk') || nameLower.includes('cadbury')) return PRODUCT_IMAGE_MAP['prod-6'];
  if (nameLower.includes('milk') || nameLower.includes('taaza')) return PRODUCT_IMAGE_MAP['prod-7'];
  if (nameLower.includes('surf') || nameLower.includes('detergent')) return PRODUCT_IMAGE_MAP['prod-8'];
  if (nameLower.includes('dettol') || nameLower.includes('handwash') || nameLower.includes('soap')) return PRODUCT_IMAGE_MAP['prod-9'];
  if (nameLower.includes('maggi') || nameLower.includes('noodle')) return PRODUCT_IMAGE_MAP['prod-10'];
  if (nameLower.includes('coffee') || nameLower.includes('nescafe') || nameLower.includes('tea')) return PRODUCT_IMAGE_MAP['prod-11'];
  if (nameLower.includes('biscuit') || nameLower.includes('parle')) return PRODUCT_IMAGE_MAP['prod-12'];
  if (nameLower.includes('colgate') || nameLower.includes('toothpaste')) return PRODUCT_IMAGE_MAP['prod-13'];
  if (nameLower.includes('chips') || nameLower.includes('lay')) return PRODUCT_IMAGE_MAP['prod-14'];
  if (nameLower.includes('red bull') || nameLower.includes('energy') || nameLower.includes('drink')) return PRODUCT_IMAGE_MAP['prod-15'];

  const catLower = (product.category || '').toLowerCase();
  if (catLower.includes('dairy')) return PRODUCT_IMAGE_MAP['prod-7'];
  if (catLower.includes('snack') || catLower.includes('chocolate')) return PRODUCT_IMAGE_MAP['prod-6'];
  if (catLower.includes('beverage')) return PRODUCT_IMAGE_MAP['prod-11'];
  if (catLower.includes('personal')) return PRODUCT_IMAGE_MAP['prod-9'];
  if (catLower.includes('household') || catLower.includes('clean')) return PRODUCT_IMAGE_MAP['prod-8'];
  if (catLower.includes('instant')) return PRODUCT_IMAGE_MAP['prod-10'];

  return PRODUCT_IMAGE_MAP['prod-1'];
}
