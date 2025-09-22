import { Request, Response } from 'express';
import { LeadService } from '../services/leadService';

const leadService = new LeadService();

/**
 * Processar lead de uma origem (campanha, site, etc)
 */
export const processLeadSource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerData, leadData } = req.body;

    if (!customerData || !leadData) {
      res.status(400).json({
        success: false,
        error: 'Dados do cliente e do lead são obrigatórios'
      });
      return;
    }

    const customer = await leadService.processLeadSource(customerData, leadData);

    res.status(201).json({
      success: true,
      data: {
        customer,
        message: 'Lead processado com sucesso'
      }
    });
  } catch (error) {
    console.error('Erro ao processar lead:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao processar lead',
      message: error.message
    });
  }
};

/**
 * Registrar conversão de lead
 */
export const registerLeadConversion = async (req: Request, res: Response): Promise<void> => {
  try {
    const conversionData = req.body;

    if (!conversionData.customerInfo || !conversionData.conversionEvent) {
      res.status(400).json({
        success: false,
        error: 'Dados do cliente e evento de conversão são obrigatórios'
      });
      return;
    }

    const result = await leadService.registerLeadConversion(conversionData);

    res.json({
      success: true,
      data: {
        ...result,
        message: result.isFirstOrder ? 'Primeira conversão realizada!' : 'Conversão registrada com sucesso'
      }
    });
  } catch (error) {
    console.error('Erro ao registrar conversão:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao registrar conversão',
      message: error.message
    });
  }
};

/**
 * Obter análise de performance de leads
 */
export const getLeadAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dateFrom, dateTo, source } = req.query;

    const filters: any = {};
    if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
    if (dateTo) filters.dateTo = new Date(dateTo as string);
    if (source) filters.source = source;

    const analytics = await leadService.getLeadAnalytics(filters);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Erro ao obter análise de leads:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter análise de leads',
      message: error.message
    });
  }
};

/**
 * Obter leads por status
 */
export const getLeadsByStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;

    const result = await leadService.getLeadsByStatus(status as string);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erro ao obter leads:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter leads',
      message: error.message
    });
  }
};

/**
 * Obter lead por CPF
 */
export const getLeadByCPF = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cpf } = req.params;

    if (!cpf) {
      res.status(400).json({
        success: false,
        error: 'CPF é obrigatório'
      });
      return;
    }

    const Customer = require('../models/Customer').Customer;
    const lead = await Customer.findOne({ cpf });

    if (!lead) {
      res.status(404).json({
        success: false,
        error: 'Lead não encontrado'
      });
      return;
    }

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('Erro ao obter lead:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter lead',
      message: error.message
    });
  }
};

/**
 * Atualizar status de lead
 */
export const updateLeadStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cpf } = req.params;
    const { status } = req.body;

    if (!cpf || !status) {
      res.status(400).json({
        success: false,
        error: 'CPF e status são obrigatórios'
      });
      return;
    }

    const Customer = require('../models/Customer').Customer;
    const lead = await Customer.findOneAndUpdate(
      { cpf },
      { leadStatus: status, updatedAt: new Date() },
      { new: true }
    );

    if (!lead) {
      res.status(404).json({
        success: false,
        error: 'Lead não encontrado'
      });
      return;
    }

    res.json({
      success: true,
      data: lead,
      message: 'Status do lead atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar status do lead:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar status do lead',
      message: error.message
    });
  }
};