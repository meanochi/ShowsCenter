import { min } from "rxjs/internal/operators/min";
import { SeatMap } from "./map-model";

export enum TargetAudience {
    PRESCHOOL = '🧸 גיל הרך',
    CHILDREN = '🪁 ילדים',    
    YOUTH = '🎧 נוער',       
    ADULTS = '☕ מבוגרים',
    SENIORS = '🧶 גיל הזהב'
}

export enum Sector {
    MEN ='גברים',
    WOMEN = 'נשים',    
    FAMILIES = 'משפחות',
    TRY = 'tryy'
}

export enum Section {
    HALL = 'אולם',
    RIGHT_BALCONY = 'יציע ימין',    
    LEFT_BALCONY = 'יציע שמאל',
    CENTER_BALCONY = 'יציע מרכז'
}

export class Show {
    id: number =0;
    title: string = '';
    date: Date = new Date();
    beginsAt: string = '';
    duration: number = 0;
    audience: TargetAudience  = TargetAudience.ADULTS;
    sector: Sector = Sector.WOMEN;
    description: string ='';
    imageUrl: string | null = null;
    providerId: number =0;
    categoryId: number =0;
    hallMap:SeatMap = new SeatMap(0, Section.HALL);
    leftBalMap:SeatMap =new SeatMap(0, Section.LEFT_BALCONY);
    rightBalMap:SeatMap =new SeatMap(0, Section.RIGHT_BALCONY);
    centerBalMap:SeatMap =new SeatMap(0, Section.CENTER_BALCONY);
    minPrice: number = 0;
    
}
