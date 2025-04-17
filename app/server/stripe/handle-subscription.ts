import 'server-only';
import Stripe from "stripe";
import { db } from "@/app/lib/firebase";
import resend from '@/app/lib/resend';

export async function handleStripeSubscription(event: Stripe.CheckoutSessionCompletedEvent) {
    if (event.data.object.payment_status === 'paid') {
        console.log('Pagamento realizado com sucesso. Enviar um email liberar acesso.');

        const metadata = event.data.object.metadata;
        const userEmail = event.data.object.customer_email || event.data.object.customer_details?.email;
        const userId = metadata?.userId;

        if (!userId || !userEmail) {
            console.error('User ID or email not found');
            return;
        }

        await db.collection('users').doc(userId).update({
            stripeSubscriptionId: event.data.object.subscription,
            subscriptionStatus: 'active'
        });
        
        const { data, error } = await resend.emails.send({
            from: 'Mail <mail@mail.com>',
            to: [userEmail],
            subject: 'Assinatura cancelada com sucesso',
            text: 'Assinatura cancelada com sucesso'
        });

        if (error) {
            console.error(error);
        }

        console.log(data);
    }
}