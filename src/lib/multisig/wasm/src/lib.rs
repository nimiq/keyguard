use curve25519_dalek::scalar::Scalar;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn aggregate_secrets(concatenated_secrets: &[u8], b: &[u8]) -> Vec<u8> {
    let number_commitments = 2; // multisig_lib::transaction::MUSIG2_PARAMETER_V;

    let b = Scalar::from_canonical_bytes(b.try_into().unwrap()).unwrap();

    let secrets = concatenated_secrets.chunks_exact(32);

    if secrets.remainder().len() != 0 {
        panic!("Invalid length of concatenated secrets");
    }

    let scalars: Vec<Scalar> = secrets
        .map(|s| Scalar::from_canonical_bytes(s.try_into().unwrap()).unwrap())
        .collect();

    let mut secret = scalars[0];
    for i in 1..number_commitments {
        let mut scale = b;
        for _j in 1..i {
            scale *= b;
        }
        secret += scalars[i] * scale;
    }

    secret.as_bytes().to_vec()
}
