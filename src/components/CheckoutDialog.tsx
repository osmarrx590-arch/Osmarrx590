import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/pages/Index";
import { toast } from "@/hooks/use-toast";
import { Loader2, CreditCard, CheckCircle2, AlertCircle, Home } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface CheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  totalPrice: number;
  onSuccess: () => void;
}

interface MercadoPagoPreference {
  items: {
    title: string;
    description: string;
    quantity: number;
    unit_price: number;
    currency_id: string;
  }[];
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_return?: string;
}

// ⚠️ IMPORTANTE: Use credenciais de USUÁRIOS DE TESTE, não da sua conta principal!
// 
// Como obter as credenciais corretas:
// 1. Acesse: https://www.mercadopago.com.br/developers/panel/app
// 2. Selecione sua aplicação
// 3. Vá em "Contas de teste" e crie um usuário tipo "Vendedor"
// 4. Faça login com o usuário de teste criado
// 5. Crie uma aplicação no painel desse usuário de teste
// 6. Copie as credenciais de PRODUÇÃO dessa aplicação de teste
// 7. Cole as credenciais abaixo
//
// Com credenciais de teste, a URL será: https://sandbox.mercadopago.com.br
// ⚠️ Credenciais abaixo são da conta PRINCIPAL e causarão erro CPT01-3BAP8IE0JHVR

const MERCADO_PAGO_PUBLIC_KEY = "APP_USR-c1f99119-2376-47f9-b456-1fa509473fb6";
const MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-3542135147633802-102621-efdb375d6e6fab25f7ab0c586304c0d3-2939944844";

const CheckoutDialog = ({
  isOpen,
  onClose,
  cart,
  totalPrice,
  onSuccess,
}: CheckoutDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success">("idle");
  const [environmentMode, setEnvironmentMode] = useState<"sandbox" | "production">("sandbox");

  // Detectar retorno do Mercado Pago via query parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentParam = urlParams.get('payment');
    
    if (paymentParam === 'success') {
      setPaymentStatus("success");
      toast({
        title: "🎉 Pagamento Confirmado!",
        description: "Seu pedido foi realizado com sucesso. Prepare-se para saborear!",
      });
      
      // Limpar o carrinho após 2 segundos
      setTimeout(() => {
        onSuccess();
        setPaymentStatus("idle");
        // Limpar query parameters da URL
        window.history.replaceState({}, '', window.location.pathname);
      }, 2000);
    } else if (paymentParam === 'failure') {
      toast({
        title: "❌ Pagamento Recusado",
        description: "O pagamento não foi aprovado. Tente novamente.",
        variant: "destructive"
      });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (paymentParam === 'pending') {
      toast({
        title: "⏳ Pagamento Pendente",
        description: "Seu pagamento está sendo processado.",
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [onSuccess]);

  const handleMercadoPagoPayment = async () => {
    setIsProcessing(true);
    setPaymentStatus("processing");

    try {
      // Detectar se está em localhost (Mercado Pago não aceita URLs locais)
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname === '[::1]';

      // Preparar itens do pedido
      const items = cart.map(item => ({
        title: item.name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.price,
        currency_id: "BRL"
      }));

      // Criar preferência de pagamento
      const preferenceData: MercadoPagoPreference = {
        items: items,
        back_urls: {
          success: window.location.origin + "/?payment=success",
          failure: window.location.origin + "/?payment=failure",
          pending: window.location.origin + "/?payment=pending"
        }
      };

      // Mercado Pago não aceita auto_return com URLs locais (localhost/127.0.0.1)
      // Apenas adicionar auto_return se NÃO for localhost
      if (!isLocalhost) {
        preferenceData.auto_return = "approved";
      }

      console.log("📦 Criando preferência de pagamento:", preferenceData);
      console.log("🎯 Modo selecionado:", environmentMode === "sandbox" ? "Sandbox (Teste)" : "Produção");
      console.log(isLocalhost ? "🏠 Ambiente local detectado - auto_return desabilitado (Mercado Pago exige URL pública)" : "🌐 Ambiente produção - auto_return habilitado");

      // Escolher o endpoint correto baseado na escolha do usuário
      const apiEndpoint = environmentMode === "sandbox" 
        ? "https://api.mercadopago.com/checkout/preferences"
        : "https://api.mercadopago.com/checkout/preferences";

      // Chamada à API do Mercado Pago
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`
        },
        body: JSON.stringify(preferenceData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Erro na API do Mercado Pago - Status:", response.status);
        console.error("❌ Detalhes do erro:", JSON.stringify(errorData, null, 2));
        console.error("📋 Payload enviado:", JSON.stringify(preferenceData, null, 2));
        
        // Verificar se o erro é relacionado à URL de retorno
        if (errorData.message && errorData.message.includes("back_urls")) {
          throw new Error("Mercado Pago não aceita URLs locais (localhost/127.0.0.1). Use o ambiente de produção (Lovable) para testar o retorno automático.");
        }
        
        throw new Error(`Erro ao criar preferência: ${errorData.message || JSON.stringify(errorData)}`);
      }

      const preference = await response.json();
      
      // Usar a URL correta baseada na escolha do usuário
      const checkoutUrl = environmentMode === "sandbox" 
        ? (preference.sandbox_init_point || preference.init_point)
        : preference.init_point;
      
      console.log("🔗 URL do checkout:", checkoutUrl);
      console.log(environmentMode === "sandbox" ? "✅ Usando ambiente de TESTE (Sandbox)" : "⚠️ Usando ambiente de PRODUÇÃO");

      // Redirecionar para checkout do Mercado Pago (mesma aba)
      window.location.href = checkoutUrl;
      
      toast({
        title: "🔄 Redirecionando para checkout",
        description: "Você será direcionado para o Mercado Pago...",
      });

    } catch (error) {
      console.error("Erro no pagamento:", error);
      toast({
        title: "Erro no pagamento",
        description: "Não foi possível processar o pagamento. Tente novamente.",
        variant: "destructive"
      });
      setPaymentStatus("idle");
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Finalizar Pedido</DialogTitle>
          <DialogDescription>
            Complete seu pedido de forma rápida e segura
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Resumo do Pedido */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-foreground">Resumo do Pedido</h4>
            {cart.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.quantity}x {item.name}
                </span>
                <span className="font-medium">
                  R$ {(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="pt-3 border-t border-border flex justify-between items-center">
              <span className="font-bold">Total:</span>
              <span className="text-2xl font-bold text-primary">
                R$ {totalPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Status de Pagamento */}
          {paymentStatus === "success" ? (
            <div className="text-center py-8 space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto animate-bounce" />
              <div>
                <h3 className="text-xl font-bold text-green-600">Pagamento Confirmado!</h3>
                <p className="text-muted-foreground">Seu pedido está sendo preparado</p>
              </div>
              <Button 
                size="lg" 
                className="w-full" 
                onClick={() => {
                  onSuccess();
                  setPaymentStatus("idle");
                  window.history.replaceState({}, '', window.location.pathname);
                }}
              >
                <Home className="w-5 h-5 mr-2" />
                Voltar à Loja
              </Button>
            </div>
          ) : (
            <>
              {/* Seleção de Ambiente */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Ambiente de Pagamento:</Label>
                <RadioGroup 
                  value={environmentMode} 
                  onValueChange={(value) => setEnvironmentMode(value as "sandbox" | "production")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2 flex-1">
                    <RadioGroupItem value="sandbox" id="sandbox" />
                    <Label htmlFor="sandbox" className="cursor-pointer flex-1 p-3 border rounded-lg hover:bg-accent">
                      <div className="font-semibold text-sm">🧪 Sandbox (Teste)</div>
                      <div className="text-xs text-muted-foreground">Para testes e desenvolvimento</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 flex-1">
                    <RadioGroupItem value="production" id="production" />
                    <Label htmlFor="production" className="cursor-pointer flex-1 p-3 border rounded-lg hover:bg-accent">
                      <div className="font-semibold text-sm">🚀 Produção</div>
                      <div className="text-xs text-muted-foreground">Pagamentos reais</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              {/* Botão Mercado Pago */}
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-[#009EE3] to-[#0084C8] hover:shadow-lg text-lg font-bold"
                onClick={handleMercadoPagoPayment}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pagar com Mercado Pago
                  </>
                )}
              </Button>

              <div className="text-center text-xs text-muted-foreground space-y-2">
                <p>🔒 Pagamento seguro via Mercado Pago</p>
                <p className="mt-1 font-semibold">
                  {environmentMode === "sandbox" ? (
                    <span className="text-green-600">✅ Modo: Sandbox (Teste)</span>
                  ) : (
                    <span className="text-yellow-600">⚠️ Modo: Produção</span>
                  )}
                </p>
              </div>

              {/* Informações sobre cartões de teste - só mostrar em modo Sandbox */}
              {environmentMode === "sandbox" && (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-blue-900 dark:text-blue-100">
                      <p className="font-semibold mb-2">📝 Cartões de teste oficiais:</p>
                      <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                        <li>• <strong>Mastercard:</strong> 5031 4332 1540 6351</li>
                        <li>• <strong>Visa:</strong> 4509 9535 6623 3704</li>
                        <li>• <strong>CVV:</strong> qualquer 3 dígitos</li>
                        <li>• <strong>Validade:</strong> qualquer data futura</li>
                        <li>• <strong>Titular:</strong> APRO (para aprovar)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Alerta sobre ambiente de produção */}
              {environmentMode === "production" && (
                <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-yellow-900 dark:text-yellow-100">
                      <p className="font-semibold mb-1">⚠️ Ambiente de Produção</p>
                      <p>Você está usando o modo de produção. Certifique-se de usar credenciais de produção válidas.</p>
                      <p className="mt-1">Os pagamentos serão reais neste modo.</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutDialog;
