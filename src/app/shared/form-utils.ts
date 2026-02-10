import { FormGroup, ValidationErrors } from '@angular/forms';

export class FormUtils {
  //identify email
  static readonly emailPattern = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';

  static isValidField(form: FormGroup, fieldName: string): boolean | null {
    return (
      !!form.controls[fieldName].errors &&
      form.controls[fieldName].touched
    );
  }
  static getFieldError(form: FormGroup, fieldName: string): string | null {
    if (!form.controls[fieldName]) return null;

    const errors = form.controls[fieldName].errors ?? {};
    return FormUtils.getTextError(errors);
  }
  static getTextError(errors: ValidationErrors): string | null {
    for (const key of Object.keys(errors)) {
      switch (key) {
        case 'required':
          return 'Este campo es requerido';
        case 'minlength':
          return `Mínimo de ${errors['minlength'].requiredLength} caracteres`;
        case 'min':
          return `Valor mínimo de ${errors['min'].min}`;
        case 'email':
          return 'El valor ingresado no es un correo electrónico válido';
        case 'emailTaken':
          return 'El correo ya está siendo utilizado';
        case 'invalidName':
          return 'El nombre no puede ser ocupado';
        case 'pattern':
          if (errors['pattern'].requiredPattern === FormUtils.emailPattern) {
            return 'El formato del correo electrónico es incorrecto';
          }
          return 'Error de patrón (expresión regular)';
        default:
          return 'Error de validación no controlado';
      }
    }
    return null;
  }
}