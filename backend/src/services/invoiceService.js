const prisma = require('../utils/prisma');
const { v4: uuidv4 } = require('uuid');

// Helper function to convert Prisma Decimal fields to JavaScript numbers with 4 decimal precision
const convertDecimalFields = (obj) => {
  if (!obj) return obj;

  if (Array.isArray(obj)) {
    return obj.map(convertDecimalFields);
  }

  if (typeof obj === 'object') {
    // Handle Date objects
    if (obj instanceof Date) {
      return obj.toISOString();
    }

    // Handle Prisma Decimal objects (they have s, e, d properties)
    if (obj.s !== undefined && obj.e !== undefined && obj.d !== undefined) {
      // This is a Prisma Decimal object, convert to number
      try {
        const decimalValue = parseFloat(obj.toString());
        return Math.round(decimalValue * 10000) / 10000; // 4 decimal places
      } catch (error) {
        console.warn('Failed to convert decimal:', obj);
        return 0;
      }
    }

    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === 'object') {
        if (value instanceof Date) {
          converted[key] = value.toISOString();
        } else if (value.s !== undefined && value.e !== undefined && value.d !== undefined) {
          // Prisma Decimal object
          try {
            const decimalValue = parseFloat(value.toString());
            converted[key] = Math.round(decimalValue * 10000) / 10000; // 4 decimal places
          } catch (error) {
            console.warn('Failed to convert decimal:', value);
            converted[key] = 0;
          }
        } else {
          converted[key] = convertDecimalFields(value);
        }
      } else {
        converted[key] = value;
      }
    }
    return converted;
  }

  return obj;
};

class InvoiceService {
  static async createInvoice(invoiceData) {
    const { items, ...allInvoiceDetails } = invoiceData;

    // Only pick fields that exist in the database schema for Invoice
    const allowedInvoiceFields = [
      'invoiceType', 'invoiceDate', 'sellerNTNCNIC', 'sellerBusinessName',
      'sellerProvince', 'sellerAddress', 'buyerNTNCNIC', 'buyerBusinessName',
      'buyerProvince', 'buyerAddress', 'buyerRegistrationType', 'invoiceRefNo', 'scenarioId', 'status', 'fbrStatus',
      'advanceTax236G', 'advanceTax236H'
    ];

    const invoiceDetails = {};
    allowedInvoiceFields.forEach(field => {
      if (allInvoiceDetails[field] !== undefined) {
        invoiceDetails[field] = allInvoiceDetails[field];
      }
    });

    // Only pick fields that exist in the database schema for InvoiceItem
    const allowedItemFields = [
      'hsCode', 'productDescription', 'rate', 'uoM', 'quantity', 'totalValues',
      'valueSalesExcludingST', 'fixedNotifiedValueOrRetailPrice', 'salesTaxApplicable',
      'salesTaxWithheldAtSource', 'extraTax', 'furtherTax', 'sroScheduleNo',
      'fedPayable', 'discount', 'saleType', 'sroItemSerialNo'
    ];

    const cleanedItems = items.map(item => {
      const cleanedItem = {};
      allowedItemFields.forEach(field => {
        if (item[field] !== undefined) {
          cleanedItem[field] = item[field];
        }
      });
      return cleanedItem;
    });

    // Calculate total amount
    let totalAmount = cleanedItems.reduce((sum, item) => sum + parseFloat(item.totalValues), 0);
    if (invoiceDetails.advanceTax236G) {
      totalAmount = totalAmount + (totalAmount * (invoiceDetails.advanceTax236G / 100))
    }
    if (invoiceDetails.advanceTax236H) {
      totalAmount = totalAmount + (totalAmount * (invoiceDetails.advanceTax236H / 100))
    }

    const invoice = await prisma.invoice.create({
      data: {
        ...invoiceDetails,
        totalAmount,
        items: {
          create: cleanedItems
        }
      },
      include: {
        items: true
      }
    });

    return convertDecimalFields(invoice);
  }

  static async getInvoices(page = 1, limit = 10, filters = {}) {
    const skip = (page - 1) * limit;

    const where = {};

    // Add filters
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.invoiceType) {
      where.invoiceType = filters.invoiceType;
    }
    if (filters.sellerBusinessName) {
      where.sellerBusinessName = {
        contains: filters.sellerBusinessName,
        mode: 'insensitive'
      };
    }
    if (filters.buyerBusinessName) {
      where.buyerBusinessName = {
        contains: filters.buyerBusinessName,
        mode: 'insensitive'
      };
    }
    if (filters.dateFrom || filters.dateTo) {
      where.invoiceDate = {};
      if (filters.dateFrom) {
        where.invoiceDate.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.invoiceDate.lte = new Date(filters.dateTo);
      }
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          items: true
        }
      }),
      prisma.invoice.count({ where })
    ]);

    return {
      invoices: invoices.map(invoice => convertDecimalFields(invoice)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  static async getInvoiceById(id) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: true
      }
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    return convertDecimalFields(invoice);
  }

  static async updateInvoice(id, updateData) {
    const { items, ...allInvoiceDetails } = updateData;

    // Only pick fields that exist in the database schema for Invoice
    const allowedInvoiceFields = [
      'invoiceType', 'invoiceDate', 'sellerNTNCNIC', 'sellerBusinessName',
      'sellerProvince', 'sellerAddress', 'buyerNTNCNIC', 'buyerBusinessName',
      'buyerProvince', 'buyerAddress', 'buyerRegistrationType', 'invoiceRefNo', 'scenarioId', 'status', 'fbrStatus',
      'advanceTax236G', 'advanceTax236H'
    ];

    const invoiceDetails = {};
    allowedInvoiceFields.forEach(field => {
      if (allInvoiceDetails[field] !== undefined) {
        invoiceDetails[field] = allInvoiceDetails[field];
      }
    });

    // Calculate new total if items are provided
    let totalAmount;
    if (items) {
      // Only pick fields that exist in the database schema for InvoiceItem
      const allowedItemFields = [
        'hsCode', 'productDescription', 'rate', 'uoM', 'quantity', 'totalValues',
        'valueSalesExcludingST', 'fixedNotifiedValueOrRetailPrice', 'salesTaxApplicable',
        'salesTaxWithheldAtSource', 'extraTax', 'furtherTax', 'sroScheduleNo',
        'fedPayable', 'discount', 'saleType', 'sroItemSerialNo'
      ];

      const cleanedItems = items.map(item => {
        const cleanedItem = {};
        allowedItemFields.forEach(field => {
          if (item[field] !== undefined) {
            cleanedItem[field] = item[field];
          }
        });
        return cleanedItem;
      });
      totalAmount = cleanedItems.reduce((sum, item) => sum + parseFloat(item.totalValues), 0);
      if (invoiceDetails.advanceTax236G) {
        totalAmount = totalAmount + (totalAmount * (invoiceDetails.advanceTax236G / 100))
      }
      if (invoiceDetails.advanceTax236H) {
        totalAmount = totalAmount + (totalAmount * (invoiceDetails.advanceTax236H / 100))
      }
    }
    const updatePayload = {
      ...invoiceDetails,
      ...(totalAmount && { totalAmount })
    };

    const invoice = await prisma.invoice.update({
      where: { id: parseInt(id) },
      data: updatePayload,
      include: {
        items: true
      }
    });

    // Update items if provided
    if (items) {
      // Only pick fields that exist in the database schema for InvoiceItem
      const allowedItemFields = [
        'hsCode', 'productDescription', 'rate', 'uoM', 'quantity', 'totalValues',
        'valueSalesExcludingST', 'fixedNotifiedValueOrRetailPrice', 'salesTaxApplicable',
        'salesTaxWithheldAtSource', 'extraTax', 'furtherTax', 'sroScheduleNo',
        'fedPayable', 'discount', 'saleType', 'sroItemSerialNo'
      ];

      const cleanedItems = items.map(item => {
        const cleanedItem = {};
        allowedItemFields.forEach(field => {
          if (item[field] !== undefined) {
            cleanedItem[field] = item[field];
          }
        });
        return cleanedItem;
      });

      // Delete existing items and create new ones
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: parseInt(id) }
      });

      await prisma.invoiceItem.createMany({
        data: cleanedItems.map(item => ({
          ...item,
          invoiceId: parseInt(id)
        }))
      });

      // Fetch updated invoice with new items
      return this.getInvoiceById(id);
    }

    return invoice;
  }

  static async deleteInvoice(id) {
    await prisma.invoice.delete({
      where: { id: parseInt(id) }
    });
  }

  static async updateInvoiceStatus(id, status) {
    const invoice = await prisma.invoice.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        items: true
      }
    });

    return invoice;
  }

  static async updateInvoiceFbrStatus(id, fbrStatus) {
    const invoice = await prisma.invoice.update({
      where: { id: parseInt(id) },
      data: { fbrStatus },
      include: {
        items: true
      }
    });

    return invoice;
  }

  static async getInvoiceStats() {
    const [
      totalInvoices,
      pendingInvoices,
      completedInvoices,
      totalAmount
    ] = await Promise.all([
      prisma.invoice.count(),
      prisma.invoice.count({ where: { status: 'pending' } }),
      prisma.invoice.count({ where: { status: 'completed' } }),
      prisma.invoice.aggregate({
        _sum: {
          totalAmount: true
        }
      })
    ]);

    return {
      totalInvoices,
      pendingInvoices,
      completedInvoices,
      totalAmount: totalAmount._sum.totalAmount ? Math.round(parseFloat(totalAmount._sum.totalAmount.toString()) * 1000) / 1000 : 0
    };
  }

  static async postToFbr(id) {
    const ThirdPartyService = require('./thirdPartyService');

    // Get the invoice with items
    const invoice = await this.getInvoiceById(id);

    try {
      // Step 1: Validate invoice
      console.log('Validating invoice:', id);
      await ThirdPartyService.validateInvoice(invoice);

      // Step 2: Post invoice
      console.log('Posting invoice to FBR:', id);
      const postResponse = await ThirdPartyService.postInvoice(invoice);

      // Step 3: Update invoice with results
      const updateData = {
        status: 'completed',
        fbrStatus: 'posted'
      };

      // Always update invoice number with FBR response invoice number
      if (postResponse.invoiceNumber) {
        updateData.invoiceNumber = postResponse.invoiceNumber;
      }

      const updatedInvoice = await prisma.invoice.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          items: true
        }
      });

      return {
        success: true,
        invoice: updatedInvoice,
        postResponse
      };

    } catch (error) {
      console.error('FBR posting failed:', error.message);
      throw new Error(error.message);
    }
  }
}

module.exports = InvoiceService;