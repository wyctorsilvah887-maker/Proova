'use server';

/**
 * @fileOverview Ações de servidor para interação com a API do Google Business Profile.
 * Permite listar contas e localizações vinculadas ao usuário autenticado.
 */

export async function listGoogleBusinessAccounts(accessToken: string) {
  try {
    const response = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Falha ao buscar contas do Google Business.');
    }

    const data = await response.json();
    return { success: true, accounts: data.accounts || [] };
  } catch (error: any) {
    console.error('Erro ao listar contas Google Business:', error);
    return { success: false, error: error.message };
  }
}

export async function listGoogleBusinessLocations(accountName: string, accessToken: string) {
  try {
    // API v4 para listar localizações (Business Information API)
    const response = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storeCode,regularOpeningHours,serviceArea,labels,adWordsLocationExtensions,latlng,websiteUri,phoneNumbers,categories,storefrontAddress,placeId`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Falha ao buscar localizações do Google Business.');
    }

    const data = await response.json();
    return { success: true, locations: data.locations || [] };
  } catch (error: any) {
    console.error('Erro ao listar localizações Google Business:', error);
    return { success: false, error: error.message };
  }
}
