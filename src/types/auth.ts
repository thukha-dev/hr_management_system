export interface FormState {
  success?: boolean;
  message: string;
  errors: {
    email?: string[];
    password?: string[];
    _form?: string[];
  };
  values: {
    email: string;
    password: string;
    remember: boolean;
  };
}

export const initialFormState: FormState = {
  message: "",
  errors: {},
  values: {
    email: "",
    password: "",
    remember: false,
  },
};
