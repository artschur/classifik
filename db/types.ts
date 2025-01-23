export interface ICompanion {
    id: number;
    name: string;
    email: string;
    description: string;
    price: number;
    age: number;
    gender: string;
    gender_identity?: string;
    languages?: string;
    verified: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface ICharacteristic {
    id: number;
    companion_id: number;
    weight: number;
    height: number;
    ethnicity: string;
    eye_color?: string;
    hair_color: string;
    hair_length?: string;
    shoe_size?: number;
    silicone: boolean;
    tattoos: boolean;
    piercings: boolean;
    smoker?: boolean;
}

export interface IReview {
    id: number;
    companion_id: number;
    user_id: string;
    comment: string;
    created_at: Date;
    updated_at: Date;
}

export interface ILocation {
    id: number;
    companion_id: number;
    neighborhood?: string;
    city: string;
    state: string;
    country: string;
    slug: string;
}

// Types for new entries (without id and timestamps)
export type NewCompanionInput = Omit<ICompanion, 'id' | 'created_at' | 'updated_at'>;
export type NewCharacteristicInput = Omit<ICharacteristic, 'id'>;
export type NewReviewInput = Omit<IReview, 'id' | 'created_at' | 'updated_at'>;
export type NewLocationInput = Omit<ILocation, 'id'>;