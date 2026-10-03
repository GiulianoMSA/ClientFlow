import { validate } from 'class-validator';

import { LoginDto } from './login.dto';

describe('LoginDto', () => {
  it('should accept a valid DTO', async () => {
    const dto = new LoginDto();

    dto.email = 'user@clientflow.com';
    dto.password = 'Senha123';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should reject an invalid email', async () => {
    const dto = new LoginDto();

    dto.email = 'invalid-email';
    dto.password = 'Senha123';

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('email');
  });

  it('should reject a password shorter than 8 characters', async () => {
    const dto = new LoginDto();

    dto.email = 'user@clientflow.com';
    dto.password = '1234567';

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('password');
  });

  it('should reject an empty DTO', async () => {
    const dto = new LoginDto();

    const errors = await validate(dto);

    expect(errors).toHaveLength(2);
  });
});