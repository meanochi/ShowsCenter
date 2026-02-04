import { SeatMap } from "./map-model";

export enum TargetAudience {
    PRESCHOOL = 'Pre-school',
    CHILDREN = 'Children',    
    YOUTH = 'Youth',       
    ADULTS = 'Adults',
    SENIORS = 'Seniors'
}

export enum Sector {
    MEN = 'Men',
    WOMEN = 'Women',    
    FAMILIES = 'Families'
}

export enum Section {
    HALL = 'Main Hall',
    RIGHT_BALCONY = 'Right Balcony',    
    LEFT_BALCONY = 'Left Balcony',
    CENTER_BALCONY = 'Center Balcony'
}

export class Show {
    id: number =0;
    title: string = '';
    date: Date = new Date();
    beginsAt: string = '';
    duration: number = 0;
    audience?: TargetAudience;
    sector? : Sector;
    description: string ='';
    imageUrl: string | null = null;
    providerId: number =0;
    categoryId: number =0;
    hallMap?:SeatMap;
    leftBalMap?:SeatMap;
    rightBalMap?:SeatMap;
    centerBalMap?:SeatMap;
}
