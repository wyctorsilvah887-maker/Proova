/**
 * Utilitários do identificador ("slug") do nome comercial da empresa.
 * Sem dependências externas, para poderem ser testados isoladamente.
 */

/**
 * Converte o nome comercial no slug usado como identificador único da empresa.
 * É a MESMA regra que o cadastro sempre usou: a verificação antecipada de nome
 * e a criação da conta precisam chegar sempre ao mesmo resultado.
 */
export function slugifyCompany(name: string): string {
  return name.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Procura uma variação livre do nome ("Nome 2", "Nome 3"...) quando o nome já está em uso.
 * `isTaken` recebe o slug e diz se ele já existe. Retorna o nome sugerido ou null.
 */
export async function findAvailableVariation(
  baseName: string,
  isTaken: (slug: string) => Promise<boolean>,
  maxNumber = 6
): Promise<string | null> {
  const options: string[] = [];
  for (let n = 2; n <= maxNumber; n++) options.push(`${baseName.trim()} ${n}`);

  const taken = await Promise.all(options.map((option) => isTaken(slugifyCompany(option))));
  const index = taken.findIndex((isUsed) => !isUsed);
  return index >= 0 ? options[index] : null;
}
