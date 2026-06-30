import { Button, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate } from 'react-router-dom';
import { handleReset } from '../../functions/auth';
import { Wrapper } from './Layout';

export default function Reset() {
  const simpleForm = useForm({ initialValues: { email: '' } });
  const navigate = useNavigate();

  return (
    <Wrapper titleText='重置密码'>
      <TextInput
        required
        label='邮箱'
        description='如果账号已注册，系统会发送重置密码链接到邮箱。'
        placeholder='email@example.org'
        {...simpleForm.getInputProps('email')}
      />
      <Button
        type='submit'
        onClick={() => handleReset(navigate, simpleForm.values)}
      >
        发送邮件
      </Button>
    </Wrapper>
  );
}
