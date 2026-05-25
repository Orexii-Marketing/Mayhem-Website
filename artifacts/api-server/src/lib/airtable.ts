const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_API_URL = "https://api.airtable.com/v0";

export function isAirtableConfigured(): boolean {
  return !!AIRTABLE_API_KEY && !!AIRTABLE_BASE_ID;
}

export async function createAirtableRecord(
  tableName: string,
  fields: Record<string, string | number | boolean | null | undefined>,
): Promise<string | null> {
  if (!isAirtableConfigured()) {
    return null;
  }

  const response = await fetch(
    `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Airtable error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as { id: string };
  return data.id;
}
