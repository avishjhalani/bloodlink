import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from 'nodemailer';

@Injectable()

export class NotificationService{
    private readonly logger = new Logger(NotificationService.name);
    private transporter;
    constructor(){
        this.transporter =nodemailer.createTransport({
            service :'gmail',
            auth:{
                user :process.env.MAIL_USER,
                pass :process.env.MAIL_PASS,
            },
        });
    }

    async notifyDonor(donor:any , request :any): Promise<void>{
        
    }
}

