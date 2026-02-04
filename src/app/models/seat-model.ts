import { Section } from "./show-model";

export class Seat{
    status:boolean=false;
    userId:number=0;
    row:number=0;
    col:number=0;
    section:Section=Section.HALL
}