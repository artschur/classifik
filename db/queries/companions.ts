'use server';

import { companionsTable, characteristicsTable } from '../schema';
import { db } from '..';
import { RegisterCompanionFormValues } from '@/components/formCompanionRegister';
import { auth } from '@clerk/nextjs/server';

export async function registerCompanion(
  companionData: RegisterCompanionFormValues
) {
  const {
    name,
    email,
    phoneNumber,
    shortDescription,
    description,
    price,
    age,
    gender,
    gender_identity,
    languages,
    city, // assuming this is an integer id for the city
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
        city_id: city,
      })
      .returning({ id: companionsTable.id });

    await db.insert(characteristicsTable).values({
      height: height,
      ethnicity: ethnicity,
      companion_id: newCompanion.id,
      eye_color: eye_color,
      hair_color: hair_color,
      hair_length: hair_length,
      shoe_size: shoe_size,
      silicone: silicone,
      tattoos: tattoos,
      piercings: piercings,
      weight: weight,
      smoker: smoker,
    });

    return newCompanion;
  } catch (error) {
    console.error('Error inserting companion or characteristics:', error);
    throw error;
  }
}
