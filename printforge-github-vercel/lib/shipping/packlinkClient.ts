/**
 * Packlink PRO Shipping Client for PrintForge
 * Official integration for multi-carrier automated labels (UPS, DHL, GLS, Poste Italiane)
 */

const PACKLINK_API_BASE = process.env.PACKLINK_ENVIRONMENT === 'sandbox'
  ? 'https://api-sandbox.packlink.com/v1'
  : 'https://api.packlink.com/v1';

const PACKLINK_KEY = process.env.PACKLINK_API_KEY || '7c960c521000e34a230c19e3ce71bda698b2a0529f3e775b717cb4106cbed93c';

export interface PacklinkAddress {
  name: string;
  surname: string;
  company?: string;
  street1: string;
  city: string;
  zip_code: string;
  country: string; // ISO 2 (e.g. IT)
  email: string;
  phone: string;
}

export interface PacklinkParcel {
  weight: number; // in kg
  width: number;  // in cm
  height: number; // in cm
  length: number; // in cm
}

export interface CreateShipmentPayload {
  service_id?: string;
  from: PacklinkAddress;
  to: PacklinkAddress;
  packages: PacklinkParcel[];
  content: string; // e.g. "Stampa 3D / Componente Tecnico"
}

export class PacklinkClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string, isSandbox = false) {
    this.apiKey = apiKey || PACKLINK_KEY;
    this.baseUrl = isSandbox
      ? 'https://api-sandbox.packlink.com/v1'
      : (process.env.PACKLINK_ENVIRONMENT === 'sandbox' ? 'https://api-sandbox.packlink.com/v1' : 'https://api.packlink.com/v1');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': this.apiKey,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Packlink API error (${response.status}): ${errText}`);
    }
    return response.json();
  }

  /**
   * Get available shipping services & rates between Maker and Client
   */
  async getServices(fromCountry: string, fromZip: string, toCountry: string, toZip: string, packages: PacklinkParcel[]) {
    const params = new URLSearchParams({
      from_country: fromCountry,
      from_zip: fromZip,
      to_country: toCountry,
      to_zip: toZip
    });
    return this.request(`/services?${params.toString()}`);
  }

  /**
   * Create an automated shipment order
   */
  async createShipment(data: CreateShipmentPayload) {
    return this.request('/shipments', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Get printable label PDF URL for a shipment
   */
  async getLabels(shipmentReference: string): Promise<{ url: string }[]> {
    return this.request(`/shipments/${shipmentReference}/labels`);
  }

  /**
   * Get tracking timeline for a shipment
   */
  async trackShipment(shipmentReference: string) {
    return this.request(`/shipments/${shipmentReference}/track`);
  }
}

export const packlinkClient = new PacklinkClient();
