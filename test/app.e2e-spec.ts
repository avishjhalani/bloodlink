import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaServices } from '../prisma/prisma.service';
describe('BloodLink API (e2e)', () => {
  let app: INestApplication;
  let avishToken: string;
  let rahulToken: string;
  let requestId: number;

  beforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  await app.init();

  // Clean up test users before running
  const prisma = app.get(PrismaServices);
  await prisma.donorNotification.deleteMany({});
  await prisma.bloodRequest.deleteMany({});
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          'avish@bloodlink-test.com',
          'rahul@bloodlink-test.com',
        ]
      }
    }
  });
}, 30000); // 30 second timeout

  afterAll(async () => {
  await app.close();
}, 30000);

  it('GET /health → returns ok', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect(res => {
        expect(res.body.status).toBe('ok');
      });
  });

  it('POST /auth/register → registers Avish', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Avish Jhalani',
        email: 'avish@bloodlink-test.com',
        password: 'password123',
        bloodType: 'O+',
        lat: 26.9124,
        lng: 75.7873,
      })
      .expect(201);

    avishToken = res.body.access_token;
    expect(avishToken).toBeDefined();
  });

  it('POST /auth/register → registers Rahul nearby', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Rahul Sharma',
        email: 'rahul@bloodlink-test.com',
        password: 'password123',
        bloodType: 'O+',
        lat: 26.9024,
        lng: 75.7773,
      })
      .expect(201);

    rahulToken = res.body.access_token;
  });

  it('POST /auth/login → invalid password returns 401', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'avish@bloodlink-test.com', password: 'wrong' })
      .expect(401);
  });

  it('POST /requests → creates request and matches Rahul', async () => {
    const res = await request(app.getHttpServer())
      .post('/requests')
      .set('Authorization', `Bearer ${avishToken}`)
      .send({
        bloodType: 'O+',
        units: 2,
        hospital: 'SMS Hospital',
        address: 'Tonk Road, Jaipur',
        lat: 26.9124,
        lng: 75.7873,
        urgency: 'critical',
      })
      .expect(201);

    requestId = res.body.request.id;
    expect(res.body.matchedDonors).toBeGreaterThan(0);
    expect(parseFloat(res.body.donors[0].distance_km)).toBeLessThan(10);
  });

  it('POST /requests → no token returns 401', () => {
    return request(app.getHttpServer())
      .post('/requests')
      .send({ bloodType: 'O+', units: 1, hospital: 'Test', address: 'Test', lat: 26.9, lng: 75.7 })
      .expect(401);
  });

  it('POST /donors/confirm/:id → Rahul confirms', () => {
    return request(app.getHttpServer())
      .post(`/donors/confirm/${requestId}`)
      .set('Authorization', `Bearer ${rahulToken}`)
      .expect(201)
      .expect(res => {
        expect(res.body.message).toContain('Thank you');
      });
  });

  it('GET /donors/profile → shows Rahul reliability score', () => {
    return request(app.getHttpServer())
      .get('/donors/profile')
      .set('Authorization', `Bearer ${rahulToken}`)
      .expect(200)
      .expect(res => {
        expect(res.body.reliabilityScore).toBeGreaterThan(0);
      });
  });

  it('PATCH /donors/availability → toggles availability', () => {
    return request(app.getHttpServer())
      .patch('/donors/availability')
      .set('Authorization', `Bearer ${rahulToken}`)
      .expect(200)
      .expect(res => {
        expect(res.body.isAvailable).toBe(false);
      });
  });

  it('GET /analytics/overview → returns stats', () => {
    return request(app.getHttpServer())
      .get('/analytics/overview')
      .set('Authorization', `Bearer ${avishToken}`)
      .expect(200)
      .expect(res => {
        expect(res.body.requests.total).toBeGreaterThan(0);
        expect(res.body.donors.total).toBeGreaterThan(0);
      });
  });

  it('PATCH /requests/:id/fulfill → marks fulfilled', () => {
    return request(app.getHttpServer())
      .patch(`/requests/${requestId}/fulfill`)
      .set('Authorization', `Bearer ${avishToken}`)
      .expect(200)
      .expect(res => {
        expect(res.body.status).toBe('fulfilled');
      });
  });
});