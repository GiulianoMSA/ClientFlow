import { validate } from 'class-validator';

import { CreateUserDto } from './create-user.dto';

describe('CreateUserDto', () => {
  it('should accept a valid DTO', async () => {
    const dto = new CreateUserDto();

    dto.email = 'user@clientflow.com';
    dto.password = 'Senha123';
    dto.name = 'John Doe';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should reject an invalid email', async () => {
    const dto = new CreateUserDto();

    dto.email = 'invalid-email';
    dto.password = 'Senha123';
    dto.name = 'John Doe';

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('email');
  });

  it('should reject a password shorter than 8 characters', async () => {
    const dto = new CreateUserDto();

    dto.email = 'user@clientflow.com';
    dto.password = '1234567';
    dto.name = 'John Doe';

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('password');
  });

  it('should reject a name shorter than 2 characters', async () => {
    const dto = new CreateUserDto();

    dto.email = 'user@clientflow.com';
    dto.password = 'Senha123';
    dto.name = 'A';

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('name');
  });

  it('should reject an empty DTO', async () => {
    const dto = new CreateUserDto();

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});