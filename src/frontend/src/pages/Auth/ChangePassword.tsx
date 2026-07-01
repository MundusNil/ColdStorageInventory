import { StylishText } from '@lib/components/StylishText';
import {
  Button,
  Divider,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate } from 'react-router-dom';
import { handleChangePassword } from '../../functions/auth';
import { useUserState } from '../../states/UserState';
import { Wrapper } from './Layout';

export default function Set_Password() {
  const simpleForm = useForm({
    initialValues: {
      current_password: '',
      new_password1: '',
      new_password2: ''
    }
  });

  const user = useUserState();
  const navigate = useNavigate();

  return (
    <Wrapper titleText='修改密码'>
      {user.username() && (
        <Paper>
          <Group>
            <StylishText size='md'>用户</StylishText>
            <Text>{user.username()}</Text>
          </Group>
        </Paper>
      )}
      <Divider p='xs' />
      <Stack gap='xs'>
        <PasswordInput
          required
          aria-label='password'
          label='当前密码'
          description='请输入当前密码'
          {...simpleForm.getInputProps('current_password')}
        />
        <PasswordInput
          required
          aria-label='input-password-1'
          label='新密码'
          description='请输入新密码'
          {...simpleForm.getInputProps('new_password1')}
        />
        <PasswordInput
          required
          aria-label='input-password-2'
          label='确认新密码'
          description='请再次输入新密码'
          {...simpleForm.getInputProps('new_password2')}
        />
      </Stack>
      <Button
        type='submit'
        onClick={() =>
          handleChangePassword(
            simpleForm.values.new_password1,
            simpleForm.values.new_password2,
            simpleForm.values.current_password,
            navigate
          )
        }
        disabled={
          simpleForm.values.current_password === '' ||
          simpleForm.values.new_password1 === ''
        }
      >
        确认
      </Button>
    </Wrapper>
  );
}
