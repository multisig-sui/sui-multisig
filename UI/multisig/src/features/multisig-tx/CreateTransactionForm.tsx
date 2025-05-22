import React, { useState, useEffect } from 'react';
import { Box, Button, Card, Flex, Heading, Text, TextField, Callout, Strong, TextArea, Code, Badge, Separator } from '@radix-ui/themes';
import { InfoCircledIcon, CheckCircledIcon, CopyIcon, PlusIcon, CrossCircledIcon, ExternalLinkIcon } from '@radix-ui/react-icons';
import { SuiMultisigConfig, SuiSigner, SuiKeyScheme } from '../../types';
import { useSuiClient, useCurrentAccount, useSignTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { fromB64, toB64 } from '@mysten/sui/utils';
import { PublicKey } from '@mysten/sui/cryptography';
import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';
import { Secp256k1PublicKey } from '@mysten/sui/keypairs/secp256k1';
import { Secp256r1PublicKey } from '@mysten/sui/keypairs/secp256r1';
import { MultiSigPublicKey } from '@mysten/sui/multisig';

const DEFAULT_GAS_BUDGET = 10000000; // Example gas budget

// Helper function to convert base64 string to Uint8Array
function b64ToUint8Array(b64: string): Uint8Array {
    const binary_string = atob(b64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
}

// Helper to parse Base64 public key with flag into SDK PublicKey object
function parseSuiPublicKey(base64Pk: string, scheme: SuiKeyScheme): PublicKey {
    const decodedBytes = b64ToUint8Array(base64Pk);
    if (decodedBytes.length === 0) throw new Error('Public key is empty after base64 decoding.');
    
    const flag = decodedBytes[0];
    const rawKeyBytes = decodedBytes.subarray(1);

    const ED25519_PUBLIC_KEY_LENGTH = 32;
    const SECP256K1_COMPRESSED_PUBLIC_KEY_LENGTH = 33;
    const SECP256R1_COMPRESSED_PUBLIC_KEY_LENGTH = 33;

    let expectedFlag: number;
    let expectedLength: number;

    switch (scheme) {
        case 'ed25519':
            expectedFlag = 0x00;
            expectedLength = ED25519_PUBLIC_KEY_LENGTH;
            if (flag !== expectedFlag || rawKeyBytes.length !== expectedLength) throw new Error(`Invalid Ed25519 PK format or length. Flag: ${flag}, Length: ${rawKeyBytes.length}`);
            return new Ed25519PublicKey(rawKeyBytes);
        case 'secp256k1':
            expectedFlag = 0x01;
            expectedLength = SECP256K1_COMPRESSED_PUBLIC_KEY_LENGTH;
            if (flag !== expectedFlag || rawKeyBytes.length !== expectedLength) throw new Error(`Invalid Secp256k1 PK format or length. Flag: ${flag}, Length: ${rawKeyBytes.length}`);
            return new Secp256k1PublicKey(rawKeyBytes);
        case 'secp256r1':
            expectedFlag = 0x02;
            expectedLength = SECP256R1_COMPRESSED_PUBLIC_KEY_LENGTH;
            if (flag !== expectedFlag || rawKeyBytes.length !== expectedLength) throw new Error(`Invalid Secp256r1 PK format or length. Flag: ${flag}, Length: ${rawKeyBytes.length}`);
            return new Secp256r1PublicKey(rawKeyBytes);
        default:
            throw new Error(`Unknown key scheme: ${scheme}`);
    }
}

interface StoredSignature {
    signerAddress: string; 
    publicKeyBase64: string; // Original base64 PK of the signer (with flag)
    rawSignatureBase64: string; // The RAW signature from the wallet (base64 of just the sig bytes, e.g., 64 bytes for Ed25519)
    keyScheme: SuiKeyScheme;
    weight: number;
}

interface CreateTransactionFormProps {
  multisigConfig: SuiMultisigConfig;
  onTransactionExecuted?: (txDigest: string) => void; 
  onCancel?: () => void;
}

export function CreateTransactionForm({ multisigConfig, onTransactionExecuted, onCancel }: CreateTransactionFormProps) {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signTransaction } = useSignTransaction();

  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionPayload, setTransactionPayload] = useState<string | null>(null); // Base64 of tx.build()
  
  const [pastedSignature, setPastedSignature] = useState<string>('');
  const [collectedSignatures, setCollectedSignatures] = useState<StoredSignature[]>([]);
  const [isSigningWallet, setIsSigningWallet] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionSuccessDigest, setExecutionSuccessDigest] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const clearMessages = () => {
      setError(null);
      setExecutionSuccessDigest(null);
      setCopySuccess(null);
  }

  const resetFormForNewTransaction = () => {
    clearMessages();
    setRecipientAddress('');
    setAmount('');
    setTransactionPayload(null);
    setCollectedSignatures([]);
    setPastedSignature('');
    setIsLoading(false);
    setIsExecuting(false);
  };

  const handlePrepareTransaction = async (event: React.FormEvent) => {
    event.preventDefault();
    clearMessages();
    setTransactionPayload(null);
    setCollectedSignatures([]);
    setIsLoading(true);

    if (!recipientAddress || !amount) {
      setError('Recipient address and amount are required.');
      setIsLoading(false);
      return;
    }

    let amountMist;
    try {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setError('Invalid amount. Must be a positive number.');
        setIsLoading(false);
        return;
      }
      amountMist = BigInt(Math.floor(parsedAmount * 1_000_000_000)); // Ensure integer MIST
    } catch (e) {
      setError('Invalid amount format.');
      setIsLoading(false);
      return;
    }
    
    try {
      const tx = new Transaction();
      tx.setSender(multisigConfig.multisigAddress);
      tx.setGasBudget(DEFAULT_GAS_BUDGET); 

      const [coin] = tx.splitCoins(tx.gas, [amountMist]);
      tx.transferObjects([coin], recipientAddress);
            
      const transactionBytes = await tx.build({ client: suiClient }); // onlyTransactionKind: false is default
      const payloadBase64 = toB64(transactionBytes);
      
      setTransactionPayload(payloadBase64);

    } catch (e: any) {
      console.error("Error preparing transaction:", e);
      setError(`Failed to prepare transaction: ${e.message}`);
      setTransactionPayload(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignWithConnectedWallet = async () => {
    if (!currentAccount || !transactionPayload) {
        setError("Wallet not connected or transaction not prepared.");
        return;
    }
    clearMessages();
    setIsSigningWallet(true);

    try {
        const signerInConfig = multisigConfig.signers.find(s => {
            try {
                const pk = parseSuiPublicKey(s.publicKey, s.keyScheme);
                return pk.toSuiAddress() === currentAccount.address;
            } catch { return false; }
        });

        if (!signerInConfig) {
            setError("Connected wallet is not one of the authorized signers for this multisig.");
            setIsSigningWallet(false);
            return;
        }

        if (collectedSignatures.some(cs => cs.publicKeyBase64 === signerInConfig.publicKey)) {
            setError("This signer has already provided a signature.");
            setIsSigningWallet(false);
            return;
        }

        const txBytesToSign = fromB64(transactionPayload);
        const { signature: walletRawSignatureB64 } = await signTransaction({ 
            transaction: Transaction.from(txBytesToSign),
            account: currentAccount,
            chain: currentAccount.chains.find(c => c.startsWith('sui:')) || currentAccount.chains[0], // Prioritize specific sui chain
         });

        // walletRawSignatureB64 is already the base64 of the raw signature bytes (e.g. 64 bytes for Ed25519)
        console.log('Received raw wallet signature (base64 string from signTransaction):', walletRawSignatureB64);
        let decodedRawSignatureBytes;
        try {
            decodedRawSignatureBytes = fromB64(walletRawSignatureB64);
            console.log('Successfully decoded raw wallet signature. Length:', decodedRawSignatureBytes.length, 'Bytes:', decodedRawSignatureBytes);
        } catch (e: any) {
            console.error('CRITICAL: Failed to decode base64 signature from signTransaction:', walletRawSignatureB64, e);
            setError(`CRITICAL: The signature received from the wallet is not valid base64: ${e.message}`);
            setIsSigningWallet(false);
            return;
        }

        if (decodedRawSignatureBytes.length !== 64 && signerInConfig.keyScheme === 'ed25519') {
             console.warn(`Warning: Decoded Ed25519 signature length is ${decodedRawSignatureBytes.length}, expected 64.`);
             // Potentially still allow to proceed if this is an SDK nuance, but flag it.
        }
        // Add similar checks for Secp256k1/r1 if their expected raw lengths are fixed (usually 64 too, or sometimes with recovery id)

        const newStoredSig: StoredSignature = {
            signerAddress: currentAccount.address,
            publicKeyBase64: signerInConfig.publicKey,
            rawSignatureBase64: walletRawSignatureB64, // Store the raw signature
            keyScheme: signerInConfig.keyScheme,
            weight: signerInConfig.weight,
        };

        setCollectedSignatures([...collectedSignatures, newStoredSig]);
        setCopySuccess(`Signature from ${currentAccount.address.slice(0,6)}... added.`);

    } catch (e: any) {
        console.error("Error signing with connected wallet:", e);
        setError(`Signing failed: ${e.message}`);
    } finally {
        setIsSigningWallet(false);
    }
  };

  const handleAddPastedSignature = () => {
    if (!pastedSignature.trim()) {
        setError("Pasted signature cannot be empty.");
        return;
    }
    clearMessages();
    try {
        const pastedFullSignatureB64 = pastedSignature.trim();
        const sigBytesWithHeaderAndPk = fromB64(pastedFullSignatureB64);
        if (sigBytesWithHeaderAndPk.length < (1 + 64 + 32)) { // Min: flag + ed25519_sig + ed25519_pk
            throw new Error("Pasted data is too short. Expected base64 of (flag || signature || publicKey).");
        }
        
        const flag = sigBytesWithHeaderAndPk[0];
        let pkLength: number;
        let sigLength: number = 64; // Standard for Ed25519, Secp256k1, Secp256r1
        let keySchemeAttempt: SuiKeyScheme;

        switch (flag) {
            case 0x00: pkLength = 32; keySchemeAttempt = 'ed25519'; break;
            case 0x01: pkLength = 33; keySchemeAttempt = 'secp256k1'; break;
            case 0x02: pkLength = 33; keySchemeAttempt = 'secp256r1'; break;
            default: throw new Error("Invalid flag byte in pasted signature.");
        }

        if (sigBytesWithHeaderAndPk.length !== (1 + sigLength + pkLength)) {
             throw new Error(`Pasted signature length (${sigBytesWithHeaderAndPk.length}) inconsistent with flag 0x${flag.toString(16)} (expected ${1+sigLength+pkLength}). Ensure it is flag || signature (${sigLength} bytes) || public key (${pkLength} bytes).`);
        }

        // Extract the raw signature bytes (middle part)
        const rawSignatureBytes = sigBytesWithHeaderAndPk.subarray(1, 1 + sigLength);
        const rawSignatureToStoreB64 = toB64(rawSignatureBytes);

        const rawPkBytesFromSig = sigBytesWithHeaderAndPk.subarray(1 + sigLength);
        const pkWithLeadingFlag = new Uint8Array(1 + rawPkBytesFromSig.length);
        pkWithLeadingFlag[0] = flag;
        pkWithLeadingFlag.set(rawPkBytesFromSig, 1);
        const pkBase64WithFlag = toB64(pkWithLeadingFlag);

        const signerInConfig = multisigConfig.signers.find(s => s.publicKey === pkBase64WithFlag && s.keyScheme === keySchemeAttempt);

        if (!signerInConfig) {
            setError(`Pasted signature corresponds to a public key (${pkBase64WithFlag.slice(0,10)}...) not in the multisig configuration or with mismatched scheme.`);
            return;
        }

        if (collectedSignatures.some(cs => cs.publicKeyBase64 === signerInConfig.publicKey)) {
            setError(`Signature for signer ${signerInConfig.publicKey.slice(0,10)}... already collected.`);
            return;
        }
        
        const suiAddressForPastedSig = parseSuiPublicKey(signerInConfig.publicKey, signerInConfig.keyScheme).toSuiAddress();

        const newStoredSig: StoredSignature = {
            signerAddress: suiAddressForPastedSig,
            publicKeyBase64: signerInConfig.publicKey,
            rawSignatureBase64: rawSignatureToStoreB64, // Store the extracted raw signature
            keyScheme: signerInConfig.keyScheme,
            weight: signerInConfig.weight,
        };
        setCollectedSignatures([...collectedSignatures, newStoredSig]);
        setPastedSignature('');
        setCopySuccess(`Pasted signature for ${suiAddressForPastedSig.slice(0,6)}... added.`);

    } catch (e:any) {
        console.error("Error adding pasted signature:", e);
        setError(`Invalid pasted signature: ${e.message}`);
    }
  }

  const handleCombineAndExecute = async () => {
    if (!transactionPayload || collectedSignatures.length === 0) {
        setError("Transaction not prepared or no signatures collected.");
        return;
    }
    clearMessages();
    setIsExecuting(true);

    try {
        const parsedSuiPublicKeysForMultiSigLib: Array<{ publicKey: PublicKey; weight: number }> = [];
        for (const signer of multisigConfig.signers) {
            parsedSuiPublicKeysForMultiSigLib.push({
                publicKey: parseSuiPublicKey(signer.publicKey, signer.keyScheme),
                weight: signer.weight,
            });
        }

        const multiSigPublicKeyInstance = MultiSigPublicKey.fromPublicKeys({
            threshold: multisigConfig.threshold,
            publicKeys: parsedSuiPublicKeysForMultiSigLib,
            // bitmap: if needed, but usually not for simple combination
        });

        // Pass the array of RAW (but base64 encoded) signatures
        const signaturesToCombine = collectedSignatures.map(cs => cs.rawSignatureBase64);

        // Check if threshold is met BEFORE attempting to combine (optional, but good UX)
        const currentTotalWeight = collectedSignatures.reduce((sum, sig) => sum + sig.weight, 0);
        if (currentTotalWeight < multisigConfig.threshold) {
            setError(`Threshold not met. Collected weight: ${currentTotalWeight}, Required: ${multisigConfig.threshold}`);
            setIsExecuting(false);
            return;
        }

        const combinedSignature = multiSigPublicKeyInstance.combinePartialSignatures(
            signaturesToCombine
        );
        
        const { digest } = await suiClient.executeTransactionBlock({
            transactionBlock: transactionPayload, // This is the Base64 of tx.build()
            signature: combinedSignature, // This is the combined multisig
            options: { showEffects: true, showObjectChanges: true },
        });

        setExecutionSuccessDigest(digest);
        if (onTransactionExecuted) onTransactionExecuted(digest);
        // Optionally reset parts of the form here or leave as is for review

    } catch (e: any) {
        console.error("Error combining signatures or executing transaction:", e);
        setError(`Execution failed: ${e.message}`);
        setExecutionSuccessDigest(null);
    } finally {
        setIsExecuting(false);
    }
  };
  
  const currentTotalWeight = collectedSignatures.reduce((sum, sig) => sum + sig.weight, 0);
  const thresholdMet = currentTotalWeight >= multisigConfig.threshold;

  const canSignWithWallet = !!(currentAccount && multisigConfig.signers.some(s => {
    try { return parseSuiPublicKey(s.publicKey, s.keyScheme).toSuiAddress() === currentAccount.address; }
    catch { return false; }
  }) && !collectedSignatures.some(cs => {
    try { return parseSuiPublicKey(cs.publicKeyBase64, cs.keyScheme).toSuiAddress() === currentAccount.address; }
    catch { return false; }
  }));

  return (
    <Card size="3">
      <Flex justify="between" align="center" mb="3">
        <Heading size="4">Create & Execute Multisig Transaction</Heading>
        {transactionPayload && (
             <Button variant="soft" color="gray" onClick={resetFormForNewTransaction} disabled={isExecuting || isLoading}>
                Start New Transaction
            </Button>
        )}
      </Flex>
      
      {!transactionPayload ? (
        <form onSubmit={handlePrepareTransaction}>
          <Flex direction="column" gap="3">
            <Box>
              <Text as="label" htmlFor="recipientAddress" size="2" weight="bold" mb="1">Recipient Sui Address</Text>
              <TextField.Root id="recipientAddress" placeholder="0x..." value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} disabled={isLoading} />
            </Box>
            <Box>
              <Text as="label" htmlFor="amount" size="2" weight="bold" mb="1">Amount (SUI)</Text>
              <TextField.Root id="amount" type="number" placeholder="0.0" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isLoading} min="0" step="any"/>
            </Box>
            <Flex gap="3" mt="3" justify="end">
              {onCancel && !transactionPayload && (
                <Button type="button" variant="soft" color="gray" onClick={() => { resetFormForNewTransaction(); if(onCancel) onCancel();}} disabled={isLoading}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Preparing...' : 'Prepare Transaction Data'}
              </Button>
            </Flex>
          </Flex>
        </form>
      ) : (
        <Box>
            <Heading size="3" mb="2">1. Transaction Payload (Serialized)</Heading>
            <TextArea readOnly value={transactionPayload} rows={5} style={{ fontFamily: 'monospace', wordBreak: 'break-all'}} onClick={(e) => { navigator.clipboard.writeText(transactionPayload); setCopySuccess('Payload copied!'); setTimeout(()=>setCopySuccess(null), 2000);}}/>
            <Text size="1" color="gray" mt="1">This is the serialized transaction data (base64 encoded) that needs to be signed. Click to copy.</Text>
            {copySuccess === 'Payload copied!' && <Text size="1" color="green" ml="2"><CheckCircledIcon/> Copied!</Text>}
            
            <Separator my="4" size="4" />

            <Heading size="3" mb="2">2. Collect Signatures</Heading>
            <Text size="2" mb="2" color="gray">Threshold: <Badge color={thresholdMet ? "green" : "orange"}>{multisigConfig.threshold}</Badge> | Collected Weight: <Badge color={thresholdMet ? "green" : "orange"}>{currentTotalWeight}</Badge></Text>

            {canSignWithWallet && (
                <Button onClick={handleSignWithConnectedWallet} disabled={isSigningWallet || !currentAccount || !!executionSuccessDigest} mb="2">
                    {isSigningWallet ? 'Signing with Wallet...' : `Sign as ${currentAccount?.address.slice(0,6)}... (Weight: ${multisigConfig.signers.find(s => { try{ return parseSuiPublicKey(s.publicKey, s.keyScheme).toSuiAddress() === currentAccount?.address } catch { return false;}} )?.weight})`}
                </Button>
            )}
            
            <Box mb="3">
                <Text as="label" htmlFor="pastedSig" size="2" weight="bold" mb="1">Paste Signature from Another Signer</Text>
                <Flex gap="2" align="end">
                    <TextField.Root id="pastedSig" placeholder="Paste Base64 (flag || sig || pk) here" value={pastedSignature} onChange={e => setPastedSignature(e.target.value)} style={{flexGrow: 1}} disabled={!!executionSuccessDigest}/>
                    <Button onClick={handleAddPastedSignature} variant="outline" disabled={!pastedSignature.trim() || !!executionSuccessDigest}><PlusIcon/> Add Signature</Button>
                </Flex>
            </Box>

            {collectedSignatures.length > 0 && (
                <Box mb="3">
                    <Text weight="bold" size="2" mb="1">Collected Signatures ({collectedSignatures.length}):</Text>
                    {collectedSignatures.map((sig, index) => (
                        <Card key={index} size="1" mb="1" variant="surface">
                            <Flex justify="between" align="center">
                                <Flex direction="column" flexGrow="1">
                                    <Text size="1"><Strong>Signer:</Strong> <Code variant="ghost">{sig.signerAddress.slice(0,8)}...{sig.signerAddress.slice(-6)}</Code> (PK: <Code variant="ghost">{sig.publicKeyBase64.slice(0,10)}...</Code>)</Text>
                                    <Text size="1"><Strong>Weight:</Strong> {sig.weight} | <Strong>Scheme:</Strong> {sig.keyScheme.toUpperCase()}</Text>
                                    {/* <Text size="1" color="gray" style={{wordBreak: 'break-all'}}><Strong>Sig:</Strong> {sig.signatureBase64.slice(0, 30)}...</Text> */} 
                                </Flex>
                                <Flex align="center" gap="2">
                                    <Button 
                                        size="1" 
                                        variant="outline" 
                                        onClick={() => {
                                            // User might want to copy the full (flag || sig || pk) if they are manually assembling elsewhere
                                            // For now, let's make this button copy the RAW signature as that's what we process internally
                                            navigator.clipboard.writeText(sig.rawSignatureBase64);
                                            setCopySuccess(`Raw signature for ${sig.signerAddress.slice(0,6)}... copied!`);
                                            setTimeout(()=>setCopySuccess(null), 2000);
                                        }}
                                        title="Copy RAW Signature (Base64 of signature bytes only)"
                                        disabled={!!executionSuccessDigest}
                                    >
                                        <CopyIcon/> Copy Raw Sig
                                    </Button>
                                    <Button 
                                        size="1" 
                                        variant="ghost" 
                                        color="red" 
                                        onClick={() => {
                                            setCollectedSignatures(collectedSignatures.filter(s => s.rawSignatureBase64 !== sig.rawSignatureBase64));
                                            clearMessages();
                                        }}
                                        disabled={!!executionSuccessDigest} 
                                        title="Remove Signature">
                                        <CrossCircledIcon/>
                                    </Button>
                                </Flex>
                            </Flex>
                        </Card>
                    ))}
                </Box>
            )}

            {copySuccess && copySuccess.includes('copied!') && copySuccess !== 'Payload copied!' && 
                <Callout.Root color="blue" size="1" mb="2">
                    <Callout.Icon><InfoCircledIcon/></Callout.Icon>
                    <Callout.Text>{copySuccess}</Callout.Text>
                </Callout.Root>
            }
            {/* Message specifically for payload copy is handled near payload text area */}
            {/* Other general success messages from signing with wallet or adding pasted sig */}
            {copySuccess && !copySuccess.includes('copied!') && (
                 <Callout.Root color="green" size="1" mb="2">
                    <Callout.Icon><CheckCircledIcon/></Callout.Icon>
                    <Callout.Text>{copySuccess}</Callout.Text>
                </Callout.Root>
            )}

            <Separator my="4" size="4" />
            <Heading size="3" mb="2">3. Execute Transaction</Heading>
            <Button onClick={handleCombineAndExecute} disabled={isExecuting || !thresholdMet || collectedSignatures.length === 0 || !!executionSuccessDigest} size="3">
                {isExecuting ? 'Executing Transaction...' : 'Combine Signatures & Execute'}
            </Button>
        </Box>
      )}

      {error && (
        <Callout.Root color="red" size="1" mt="3">
          <Callout.Icon><InfoCircledIcon /></Callout.Icon>
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}
      {executionSuccessDigest && (
        <Callout.Root color="green" size="2" mt="3" variant="surface">
            <Flex direction="column" gap="2" align="center">
                <Flex align="center" gap="2">
                    <Callout.Icon>
                        <CheckCircledIcon width="20" height="20"/>
                    </Callout.Icon>
                    <Heading size="4" color="green">Transaction Executed Successfully!</Heading>
                </Flex>
                <Text size="2">Digest:</Text>
                <Code variant="soft" color="green" style={{padding: 'var(--space-2)', wordBreak: 'break-all'}}>
                    {executionSuccessDigest}
                </Code>
                <Flex gap="3" mt="2">
                    <Button 
                        size="1" 
                        variant="outline" 
                        color="gray"
                        onClick={() => {
                            navigator.clipboard.writeText(executionSuccessDigest);
                            setCopySuccess('Digest copied!');
                            setTimeout(() => setCopySuccess(null), 2000);
                        }}
                    >
                        <CopyIcon/> Copy Digest
                    </Button>
                    <Button asChild size="1" variant="surface">
                        <a href={`https://suiscan.xyz/testnet/tx/${executionSuccessDigest}`} target="_blank" rel="noopener noreferrer">
                            View on Suiscan <ExternalLinkIcon/>
                        </a>
                    </Button>
                </Flex>
                {copySuccess === 'Digest copied!' && <Text size="1" color="blue"><CheckCircledIcon/> Copied!</Text>}
            </Flex>
        </Callout.Root>
      )}
      
      <Box mt="4" p="3" style={{border: '1px dashed var(--gray-a7)', borderRadius: 'var(--radius-2)'}}>
        <Text color="gray" size="2">
            <Strong>Process:</Strong> 1. Prepare transaction data. 2. Collect signatures from authorized signers (each signer uses the payload and their private key). 3. Combine valid signatures and execute on the Sui network if threshold is met.
        </Text>
      </Box>
    </Card>
  );
} 