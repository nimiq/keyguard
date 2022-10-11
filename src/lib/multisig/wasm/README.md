Commands to build this Rust code to WASM:

```sh
# Compile to WASM target
cargo build --target wasm32-unknown-unknown --release

# Generate JS bindings and optimize WASM file
wasm-bindgen --target no-modules --out-dir ./pkg --out-name multisig target/wasm32-unknown-unknown/release/nimiq_keyguard_multisig_wasm.wasm
```
