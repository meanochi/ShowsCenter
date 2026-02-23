import { SeatMap } from "./map-model";


export enum TargetAudience {
    PRESCHOOL = '🧸 גיל הרך',
    CHILDREN = '🪁 ילדים',    
    YOUTH = '🎧 נוער',       
    ADULTS = '☕ מבוגרים',
    SENIORS = '🧶 גיל הזהב'
}

export enum Sector {
    MEN ='🍀 גברים',
    WOMEN = '🍁 נשים',    
    FAMILIES = '🍂 משפחות'
}

export enum Section {
    HALL = 'אולם',
    RIGHT_BALCONY = 'יציע ימין',    
    LEFT_BALCONY = 'יציע שמאל',
    CENTER_BALCONY = 'יציע מרכז'
}

export const SECTION_ID_MAP: { [key: number]: Section } = {
    1: Section.HALL,
    2: Section.RIGHT_BALCONY,
    3: Section.LEFT_BALCONY,
    4: Section.CENTER_BALCONY
};

/** Map Section enum to server section id (for POST body). */
export const SECTION_TO_ID: { [key in Section]: number } = {
    [Section.HALL]: 1,
    [Section.RIGHT_BALCONY]: 2,
    [Section.LEFT_BALCONY]: 3,
    [Section.CENTER_BALCONY]: 4
};

export class Show {
    id: number =0;
    title: string = '';
    date: Date = new Date();
    beginTime: Date = new Date();
    endTime: Date = new Date();
    audience: TargetAudience  = TargetAudience.ADULTS;
    sector: Sector = Sector.WOMEN;
    description: string ='';
    imgUrl: string | null = null;
    providerId: number =0;
    providerName:string='';
    providerProfileImgUrl:string=''
    categoryId: number= 301;
    categoryName: string='';
    hallMap:SeatMap = new SeatMap(0, Section.HALL);
    leftBalMap:SeatMap =new SeatMap(0, Section.LEFT_BALCONY);
    rightBalMap:SeatMap =new SeatMap(0, Section.RIGHT_BALCONY);
    centerBalMap:SeatMap =new SeatMap(0, Section.CENTER_BALCONY);
    minPrice: number = 0;
    popularity?: number;

    constructor(init?: Partial<Show>) {
        Object.assign(this, init);
    }
}


