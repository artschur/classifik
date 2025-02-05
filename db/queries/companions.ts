import { db } from '../index';
import { companionsTable, characteristicsTable } from '../schema';
import { RegisterCompanionFormValues } from '@/components/formCompanionRegister';
import { auth } from '@clerk/nextjs/server';

export async function registerCompanion(companionData: RegisterCompanionFormValues) {
  const {
    name,
    email,
    shortDescription,
    phoneNumber,
    description,
    price,
    age,
    gender,
    gender_identity,
    languages,
    weight,
    height,
    ethnicity,
    eye_color,
    hair_color,
    hair_length,
    shoe_size,
    silicone,
    tattoos,
    piercings,
    smoker,
    city,
    state,
    country,
    // neighborhood, etc. if needed
  } = companionData;

  const userSession = await auth();
  if (!userSession?.userId) {
    throw new Error('User not authenticated');
  }

  try {
    // 1) Insert into companionsTable
    const [newCompanion] = await db
      .insert(companionsTable)
      .values({
        auth_id: userSession.userId,
        name: name,
        email: email,
        phone: phoneNumber,
        shortDescription: shortDescription,
        description: description,
        price: price,
        age: age,
        gender: gender,
        gender_identity: gender_identity,
        languages: languages, 
        city_id: city, // or city_id: city.id if you have a lookup
        // must be an array if columns define string[]
        // city_id: (some ID if you have a lookup),
        // or store city/slug directly if that's how your schema is defined
      })
      .returning({ id: companionsTable.id });

    // 2) Insert into characteristicsTable
    await db.insert(characteristicsTable).values({
      companion_id: newCompanion.id,
      weight: weight,
      height: height,
      ethnicity: ethnicity,
      eye_color: eye_color,
      hair_color: hair_color,
      hair_length: hair_length,
      shoe_size: shoe_size,
      silicone: silicone,
      tattoos: tattoos,
      piercings: piercings,
      smoker: smoker,
    });

    return newCompanion;
  } catch (error) {
    console.error('Error inserting companion or characteristics:', error);
    throw error;
  }
}