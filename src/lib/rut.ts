/**
 * SmarterOS Identity - Validador de RUT Chileno
 * Limpia y valida formato de RUT
 */

export function cleanRut(rut: string): string {
  return rut.replace(/\./g, '').replace('-', '').toUpperCase();
}

export function validateRut(rut: string): boolean {
  try {
    const clean = cleanRut(rut);
    
    if (clean.length < 8 || clean.length > 9) return false;
    
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);
    
    let sum = 0;
    let multiplier = 2;
    
    for (let i = body.length - 1; i >= 0; i--) {
      sum += multiplier * parseInt(body[i], 10);
      multiplier = multiplier < 7 ? multiplier + 1 : 2;
    }
    
    const expected = 11 - (sum % 11);
    const dvCalc = expected === 11 ? '0' : expected === 10 ? 'K' : expected.toString();
    
    return dvCalc === dv;
  } catch (err) {
    return false;
  }
}

export function formatRut(rut: string): string {
  const clean = cleanRut(rut);
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  
  // Formato: 12.345.678-K
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted}-${dv}`;
}
