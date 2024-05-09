"use server"

import { redirect } from "next/navigation";
import Stripe from "stripe";
import { handleError } from "../utils";
import { connectToDatabase } from "../database/mongoose";
import Transaction from "../database/models/transaction.model";
import { updateCredits } from "./user.actions";

export async function checkoutCredits(transcation: CheckoutTransactionParams) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);


    const amount = Number(transcation.amount) * 100;

    const session = await stripe.checkout.sessions.create({
        line_items:[
            {
                price_data:{
                    currency: "usd",
                    unit_amount: amount,
                    product_data:{
                        name: transcation.plan,
                }
            },
            quantity: 1
            },
        ],
        metadata:{
            plan: transcation.plan,
            credits: transcation.credits,
            buyerId: transcation.buyerId,
        },
        mode: "payment",
        success_url:`${process.env.NEXT_PUBLIC_SERVER_URL}/profile`,
        cancel_url:`${process.env.NEXT_PUBLIC_SERVER_URL}/`,
    })

    redirect(session.url!)
}

export async function  createTransaction(transcation: CreateTransactionParams) {
    try {
        await connectToDatabase();

        //create new transaction with a buyerId
        const newTransaction = await Transaction.create({
            ...transcation, buyer: transcation.buyerId
        })

        await updateCredits(transcation.buyerId, transcation.credits);

        return JSON.parse(JSON.stringify(newTransaction));
    } catch (error) {
        handleError(error)
    }
}