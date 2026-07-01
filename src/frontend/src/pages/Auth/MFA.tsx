import { Button, Checkbox, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { handleMfaLogin, handleWebauthnLogin } from '../../functions/auth';
import { useServerApiState } from '../../states/ServerApiState';
import { Wrapper } from './Layout';

export default function Mfa() {
  const simpleForm = useForm({ initialValues: { code: '', remember: false } });
  const navigate = useNavigate();
  const location = useLocation();
  const [loginError, setLoginError] = useState<string | undefined>(undefined);
  const [mfa_context] = useServerApiState(
    useShallow((state) => [state.mfa_context])
  );
  const mfa_types = mfa_context?.types || [];

  useEffect(() => {
    if (mfa_types.includes('webauthn') || mfa_types.includes('webauthn_2fa')) {
      handleWebauthnLogin(navigate, location);
    }
  }, [mfa_types]);

  return (
    <Wrapper titleText='二次验证' logOff>
      {(mfa_types.includes('recovery_codes') || mfa_types.includes('totp')) && (
        <TextInput
          required
          label='验证码'
          name='TOTP'
          description={`请输入验证码：${mfa_types.join(' / ')}`}
          {...simpleForm.getInputProps('code')}
          error={loginError}
        />
      )}

      <Checkbox
        label='记住这台设备'
        name='remember'
        description='启用后，30 天内这台设备不再要求二次验证。'
        {...simpleForm.getInputProps('remember', { type: 'checkbox' })}
      />
      <Button
        type='submit'
        onClick={() =>
          handleMfaLogin(navigate, location, simpleForm.values, setLoginError)
        }
      >
        登录
      </Button>
    </Wrapper>
  );
}
