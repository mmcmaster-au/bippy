import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormGroup, FormControl, Validators, ValidationErrors } from '@angular/forms';

import { mnemonicToEntropyAsync, entropyToMnemonicAsync, validateMnemonicAsync } from 'bip39-web';

import { combineLatest, from, of } from 'rxjs';
import { tap, switchMap} from 'rxjs/operators';

export async function seedLengthValidator(control: AbstractControl): Promise<ValidationErrors | null> {
  try {
    if (control.value) {
      await mnemonicToEntropyAsync(control.value);
    }
  }
  catch (e) {
    let err = e as Error;
    if (err &&
      (err.message == "Invalid mnemonic") ||
      (err.message == "Invalid entropy")) {

      return { seedLength: true };
    }
  }

  return null;
}

export async function seedValidValidator(control: AbstractControl): Promise<ValidationErrors | null> {
  try {
    if (control.value) {
      await mnemonicToEntropyAsync(control.value);
    }
  }
  catch (e) {
    return { seedInvalid: true };
  }

  return null;
}


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'bippy';

  xorForm = new FormGroup({
    seedPhrase: new FormControl('', [Validators.required], [seedLengthValidator, seedValidValidator]),
    xorPhrase1: new FormControl({ value: '', disabled: true }),
    xorPhrase2: new FormControl({ value: '', disabled: true }),
  });

  joinForm = new FormGroup({
    joinPhrase1: new FormControl('', [Validators.required], [seedLengthValidator, seedValidValidator]),
    joinPhrase2: new FormControl('', [Validators.required], [seedLengthValidator, seedValidValidator]),
    joinedSeed: new FormControl({ value: '', disabled: true }),
  })


  get seedPhrase(): FormControl { return this.xorForm.get("seedPhrase") as FormControl; }
  get xorPhrase1(): FormControl { return this.xorForm.get("xorPhrase1") as FormControl; }
  get xorPhrase2(): FormControl { return this.xorForm.get("xorPhrase2") as FormControl; }


  get joinedSeed(): FormControl { return this.joinForm.get("joinedSeed") as FormControl; }
  get joinPhrase1(): FormControl { return this.joinForm.get("joinPhrase1") as FormControl; }
  get joinPhrase2(): FormControl { return this.joinForm.get("joinPhrase2") as FormControl; }


  ngOnInit() {
    this.seedPhrase.valueChanges
      .pipe(
        tap(phrase => {
          this.xorPhrase1?.setValue(null);
          this.xorPhrase1?.setValue(null);
          }),
        switchMap(phrase => {
          return from(validateMnemonicAsync(phrase).then(isValid => {
            if (!isValid) {
              return of('');
            }
            return phrase;
          }));
        }),
        switchMap(phrase => {
          if (phrase.length) {
            return from (mnemonicToEntropyAsync(phrase))
          }
          else {
            return of('');
          }
        })
      )
      .subscribe(
        entropy => {
          if (entropy.length) {
              let secret = Buffer.from(entropy, 'hex');
              let otp = Buffer.alloc(secret.byteLength);
              window.crypto.getRandomValues(otp);

              let xorValues = Buffer.alloc(secret.byteLength);

              for (let i = 0; i < secret.byteLength; ++i) {
                xorValues[i] = secret[i] ^ otp[i];
              }

              entropyToMnemonicAsync(otp)
                .then(otpPhrase => this.xorForm.get("xorPhrase1")?.setValue(otpPhrase));

              entropyToMnemonicAsync(xorValues)
                .then(xorPhrase => this.xorForm.get("xorPhrase2")?.setValue(xorPhrase));
            }
          });

    let joinEntropy1 = this.joinPhrase1.valueChanges
    .pipe(
      switchMap(x => {
        return from(validateMnemonicAsync(x)
          .then(isValid => {
            return isValid ? x : Promise.resolve(null);
          }));
      }),
      switchMap(x => {
        return x ? from(mnemonicToEntropyAsync(x)) : of('');
      })
    );

    let joinEntropy2 = this.joinPhrase2.valueChanges
    .pipe(
      switchMap(x => {
        return from(validateMnemonicAsync(x)
          .then(isValid => {
            return isValid ? x : Promise.resolve(null);
          }));
      }),
      switchMap(x => {
        return x ? from(mnemonicToEntropyAsync(x)) : of('');
      })
    );

    combineLatest([joinEntropy1, joinEntropy2])
    .pipe(
      tap(x => {
        this.joinedSeed?.setValue(null);
        })
    )
    .subscribe(
      x => {
        if (x[0] && x[1]) {
            let part1 = Buffer.from(x[0], 'hex');
            let part2 = Buffer.from(x[1], 'hex');

            let xorValues = Buffer.alloc(part1.byteLength);

            for (let i = 0; i < part1.byteLength; ++i) {
              xorValues[i] = part1[i] ^ part2[i];
            }

            entropyToMnemonicAsync(xorValues)
              .then(xorPhrase => this.joinForm.get("joinedSeed")?.setValue(xorPhrase));
          }
        });
  }
}


