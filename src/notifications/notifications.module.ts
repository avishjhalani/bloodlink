import { Module } from "@nestjs/common";
import { NotificationService } from "./notifications.service";
import { BullModule } from "@nestjs/bull";
import { NotificationProcessor } from "./notifications.processor";

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'notifications',
        }),
    ],
    providers :[NotificationService, NotificationProcessor],
    exports :[NotificationService, BullModule]
})
export class NotificationsModule{}
