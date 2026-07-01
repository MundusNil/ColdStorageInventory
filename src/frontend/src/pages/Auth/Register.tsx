import { Anchor, Text } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { RegistrationForm } from '../../components/forms/AuthenticationForm';
import { Wrapper } from './Layout';

export default function Register() {
  const navigate = useNavigate();

  return (
    <Wrapper titleText='注册账号' smallPadding>
      <RegistrationForm />
      <Text ta='center' size={'xs'} mt={'md'}>
        <Anchor
          component='button'
          type='button'
          c='dimmed'
          size='xs'
          onClick={() => navigate('/login')}
        >
          返回登录
        </Anchor>
      </Text>
    </Wrapper>
  );
}
