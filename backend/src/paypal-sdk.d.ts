declare module '@paypal/checkout-server-sdk' {
  export namespace core {
    class PayPalHttpClient {
      constructor(environment: any);
      execute(request: any): Promise<any>;
    }

    class SandboxEnvironment {
      constructor(clientId: string, clientSecret: string);
    }

    class LiveEnvironment {
      constructor(clientId: string, clientSecret: string);
    }
  }

  export namespace orders {
    class OrdersCreateRequest {
      constructor();
      prefer(preference: string): void;
      requestBody(body: any): void;
    }

    class OrdersCaptureRequest {
      constructor(orderId: string);
      requestBody(body: any): void;
    }

    class OrdersGetRequest {
      constructor(orderId: string);
    }
  }

  const paypal: {
    core: typeof core;
    orders: typeof orders;
  };

  export default paypal;
}
