export class CreateRequestDto{
    bloodType : string;
    units : number;
    hospital : string;
    address : string;
    lat : number;
    lng :number;
    urgency? :string;
}
